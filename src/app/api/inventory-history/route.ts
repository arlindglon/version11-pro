import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET - Fetch inventory history with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const actionType = searchParams.get('actionType');
    const category = searchParams.get('category');

    console.log('Inventory history request:', { month, dateFrom, dateTo, actionType, category });

    // Build date filter
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (month && month !== 'all') {
      const monthNum = parseInt(month);
      const year = now.getFullYear();
      startDate = new Date(year, monthNum, 1);
      endDate = new Date(year, monthNum + 1, 0, 23, 59, 59);
    }

    if (dateFrom) {
      startDate = new Date(dateFrom);
    }
    if (dateTo) {
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch products with current stock
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, category, stock, purchasePrice, salePrice, createdAt, imageUrl');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json([]);
    }

    const products = productsData || [];
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Fetch ALL sales
    const { data: allSalesData } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: true });

    // Fetch ALL purchases
    const { data: allPurchasesData } = await supabase
      .from('purchases')
      .select('*')
      .order('date', { ascending: true });

    // Fetch ALL stock adjustments
    const { data: allAdjustmentsData } = await supabase
      .from('stock_adjustments')
      .select('*')
      .order('created_at', { ascending: true });

    // Build transaction history per product
    const productTransactions: Map<string, Array<{
      id: string;
      type: 'sale' | 'purchase' | 'adjustment' | 'damage';
      date: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      reference: string;
      notes: string;
      userId?: string;
      userName?: string;
    }>> = new Map();

    // Process all purchases FIRST (stock increases)
    (allPurchasesData || []).forEach((purchase: any) => {
      const items = typeof purchase.items === 'string' ? safeParseJSON(purchase.items) : (purchase.items || []);
      items.forEach((item: any, index: number) => {
        const productId = item.productId;
        if (!productId) return;

        if (!productTransactions.has(productId)) {
          productTransactions.set(productId, []);
        }

        const qty = Math.abs(item.quantity || 1);
        productTransactions.get(productId)!.push({
          id: `purchase-${purchase.id}-${index}`,
          type: 'purchase',
          date: purchase.date || purchase.created_at || purchase.createdAt,
          quantity: qty, // Positive for purchases
          unitPrice: item.unitPrice || item.purchasePrice || 0,
          totalPrice: item.totalPrice || 0,
          reference: purchase.purchase_number || purchase.purchaseNumber || purchase.id.slice(0, 8),
          notes: `Purchased from ${purchase.supplier_name || purchase.supplierName || 'Supplier'}`,
          userId: purchase.created_by || purchase.createdBy,
          userName: purchase.created_by_name || purchase.createdByName,
        });
      });
    });

    // Process all sales (stock decreases)
    (allSalesData || []).forEach((sale: any) => {
      const items = typeof sale.items === 'string' ? safeParseJSON(sale.items) : (sale.items || []);
      items.forEach((item: any, index: number) => {
        const productId = item.productId;
        if (!productId) return;

        if (!productTransactions.has(productId)) {
          productTransactions.set(productId, []);
        }

        const qty = Math.abs(item.quantity || 1);
        productTransactions.get(productId)!.push({
          id: `sale-${sale.id}-${index}`,
          type: 'sale',
          date: sale.date || sale.created_at || sale.createdAt,
          quantity: -qty, // Negative for sales
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: item.totalPrice || item.total || 0,
          reference: sale.invoice_number || sale.invoiceNumber || sale.id.slice(0, 8),
          notes: `Sold to ${sale.customer_name || sale.customerName || 'Walk-in Customer'}`,
          userId: sale.created_by || sale.createdBy,
          userName: sale.created_by_name || sale.createdByName || sale.salesman_name || sale.salesmanName,
        });
      });
    });

    // Process all stock adjustments
    (allAdjustmentsData || []).forEach((adj: any) => {
      const productId = adj.product_id;
      if (!productId) return;

      if (!productTransactions.has(productId)) {
        productTransactions.set(productId, []);
      }

      const adjType = adj.adjustment_type || 'adjustment';
      const qty = adj.quantity || 0;

      productTransactions.get(productId)!.push({
        id: adj.id,
        type: adjType === 'damage' ? 'damage' : 'adjustment',
        date: adj.created_at,
        quantity: qty,
        unitPrice: 0,
        totalPrice: 0,
        reference: adj.id.slice(0, 8),
        notes: adj.reason || `${adjType} adjustment`,
        userId: adj.user_id,
        userName: adj.user_name,
      });
    });

    // Sort transactions by date for each product (oldest first)
    productTransactions.forEach((transactions) => {
      transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Build history entries - START FROM 0 for new products
    const historyEntries: any[] = [];

    productTransactions.forEach((transactions, productId) => {
      const product = productMap.get(productId);
      if (!product) return;

      // Get current stock from database
      const currentStock = product.stock || 0;
      
      // Calculate total change from all transactions
      const totalChange = transactions.reduce((sum, tx) => sum + tx.quantity, 0);
      
      // Calculate what the initial stock SHOULD have been
      // Formula: Initial = Current - TotalChange
      // But for new products added through inventory, initial should be 0
      // So we trust the current stock and work backwards
      
      let initialStock = currentStock - totalChange;
      
      // If initial stock is negative, it means there's data inconsistency
      // In that case, we assume initial was 0 and adjust
      if (initialStock < 0) {
        console.log(`Data inconsistency for ${product.name}: currentStock=${currentStock}, totalChange=${totalChange}, calculated initial=${initialStock}`);
        console.log(`Transactions for ${product.name}:`, transactions.map(t => ({ type: t.type, qty: t.quantity, date: t.date })));
        // This means the product was added fresh with stock=0
        // So we start from 0
        initialStock = 0;
      }

      let runningStock = initialStock;

      // Process each transaction
      transactions.forEach((tx, index) => {
        const previousStock = runningStock;
        const newStock = runningStock + tx.quantity;
        const isLastTransaction = index === transactions.length - 1;

        // Determine action type
        let actionDisplay = 'added';
        if (tx.type === 'sale') actionDisplay = 'sold';
        else if (tx.type === 'purchase') actionDisplay = 'added';
        else if (tx.type === 'damage') actionDisplay = 'damaged';
        else if (tx.type === 'adjustment') actionDisplay = 'adjusted';

        historyEntries.push({
          id: tx.id,
          productId: productId,
          productName: product.name,
          sku: product.sku || '',
          category: product.category || '',
          image: product.imageUrl || undefined,
          actionType: actionDisplay,
          quantityChange: tx.quantity,
          previousStock: previousStock,
          newStock: newStock,
          currentStock: currentStock,
          stockVerified: isLastTransaction ? (newStock === currentStock) : true,
          unitPrice: tx.unitPrice,
          totalPrice: tx.totalPrice,
          notes: tx.notes,
          reference: tx.reference,
          userId: tx.userId,
          userName: tx.userName,
          createdAt: tx.date,
          transactionIndex: index + 1,
          totalTransactions: transactions.length,
        });

        runningStock = newStock;
      });

      // If there are NO transactions but product has stock, show as initial
      if (transactions.length === 0 && currentStock > 0) {
        historyEntries.push({
          id: `initial-${productId}`,
          productId: productId,
          productName: product.name,
          sku: product.sku || '',
          category: product.category || '',
          image: product.imageUrl || undefined,
          actionType: 'added',
          quantityChange: currentStock,
          previousStock: 0,
          newStock: currentStock,
          currentStock: currentStock,
          stockVerified: true,
          unitPrice: product.purchasePrice || 0,
          totalPrice: 0,
          notes: 'Initial stock',
          reference: 'N/A',
          userId: '',
          userName: '',
          createdAt: product.createdAt || new Date().toISOString(),
          transactionIndex: 1,
          totalTransactions: 1,
        });
      }
    });

    // Filter by date range
    let filteredHistory = historyEntries;

    if (startDate) {
      filteredHistory = filteredHistory.filter(h => new Date(h.createdAt) >= startDate!);
    }
    if (endDate) {
      filteredHistory = filteredHistory.filter(h => new Date(h.createdAt) <= endDate!);
    }

    // Filter by actionType
    if (actionType && actionType !== 'all') {
      filteredHistory = filteredHistory.filter(h => h.actionType === actionType);
    }

    // Filter by category
    if (category && category !== 'all') {
      filteredHistory = filteredHistory.filter(h =>
        h.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Sort by date descending
    filteredHistory.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Limit results
    const limitedHistory = filteredHistory.slice(0, 500);

    console.log(`Generated ${limitedHistory.length} inventory history entries`);
    return NextResponse.json(limitedHistory);
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// Safe JSON parser
function safeParseJSON(str: string | null | undefined): any[] {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

// POST - Create inventory history entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      productName,
      sku,
      actionType,
      quantityChange,
      previousStock,
      newStock,
      unitPrice,
      totalPrice,
      notes,
      reference,
      userId,
      userName
    } = body;

    const id = `ih_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    try {
      await supabase
        .from('InventoryHistory')
        .insert({
          id,
          productId,
          productName,
          sku,
          actionType,
          quantityChange,
          previousStock,
          newStock,
          unitPrice: unitPrice || 0,
          totalPrice: totalPrice || 0,
          notes: notes || '',
          reference: reference || '',
          userId: userId || '',
          userName: userName || '',
          createdAt
        });
    } catch (insertError) {
      console.log('Could not insert into InventoryHistory table:', insertError);
    }

    return NextResponse.json({
      id,
      productId,
      productName,
      sku,
      actionType,
      quantityChange,
      previousStock,
      newStock,
      unitPrice: unitPrice || 0,
      totalPrice: totalPrice || 0,
      notes,
      reference,
      userId,
      userName,
      createdAt
    });
  } catch (error) {
    console.error('Error creating inventory history:', error);
    return NextResponse.json({ error: 'Failed to create inventory history' }, { status: 500 });
  }
}
