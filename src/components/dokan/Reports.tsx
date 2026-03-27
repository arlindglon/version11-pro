'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage, formatCurrency, CURRENCY_SYMBOL } from '@/contexts/LanguageContext';
import { Sale, Product, Expense, Purchase, User, SaleItem, Customer } from '@/types';
import { 
  Printer, TrendingUp, TrendingDown, DollarSign, 
  ShoppingCart, Package, Users, Truck, AlertTriangle,
  Calendar, ArrowUpRight, ArrowDownRight, BarChart3,
  User as UserIcon, Filter, Clock, X, Plus, Trash2, 
  Edit, Eye, Save, RefreshCw, ChevronRight, Minus,
  Crown, Star, Sparkles, Zap, Database, Globe,
  CreditCard, Calculator, FileText, Download, Search,
  AlertCircle, CheckCircle, Activity, PieChart, LineChart,
  Layers, Receipt, Clock3, FileSearch, History, MoreVertical,
  ChevronDown, ArrowLeft, ArrowRight, FileBarChart, ArrowUpDown,
  Image as ImageIcon, Wrench
} from 'lucide-react';

interface InventoryHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  actionType: 'added' | 'sold' | 'damaged' | 'adjusted' | 'purchase' | 'return';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  reference?: string;
  userId?: string;
  userName?: string;
  image?: string;
  category?: string;
  createdAt: string;
}

interface Props {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  purchases: Purchase[];
  users?: User[];
  customers?: Customer[];
  currentUser?: { id: string; name: string; role: string } | null;
  onDataRefresh?: () => void;
}

type ReportTab = 'dashboard' | 'transactions' | 'sales' | 'salesman' | 'purchases' | 'inventory' | 'inventory-history' | 'profit';
type DatePreset = 'today' | 'yesterday' | 'tomorrow' | 'week' | 'month' | 'year' | 'all' | 'custom';
type TransactionType = 'all' | 'sale' | 'purchase' | 'expense';

interface EditingSale {
  id: string;
  customerName: string;
  items: (SaleItem & { tempId?: string })[];
  subtotal: number;
  itemDiscount: number;
  cartDiscount: number;
  discountType: 'flat' | 'percent';
  discountPercent: number;
  taxAmount: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: string;
  notes: string;
  salesmanName: string;
  invoiceNumber: string;
  date: string;
}

interface AuditLogEntry {
  id: string;
  transactionId: string;
  transactionType: 'sale' | 'purchase' | 'expense';
  action: 'created' | 'edited' | 'deleted' | 'viewed' | 'printed';
  userId: string;
  userName: string;
  timestamp: Date;
  details: string;
}

const Reports: React.FC<Props> = ({ sales, products, expenses, purchases, users = [], customers = [], currentUser, onDataRefresh }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ReportTab>('dashboard');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState<string>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Transaction filter
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sales Transaction Editor State
  const [showSaleEditor, setShowSaleEditor] = useState(false);
  const [editingSale, setEditingSale] = useState<EditingSale | null>(null);
  const [originalItemQuantities, setOriginalItemQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  
  // Audit Log State
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedTransactionForAudit, setSelectedTransactionForAudit] = useState<string | null>(null);
  
  // Return Modal State
  const [returningSale, setReturningSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [returnLoading, setReturnLoading] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'store_credit' | 'original'>('original');
  
  // Payment Modal State
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Print ref
  const printRef = useRef<HTMLDivElement>(null);
  
  // Inventory History State
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [categoryFilterMode, setCategoryFilterMode] = useState<'all' | 'batch' | 'custom'>('all');
  const [selectedBatchCategories, setSelectedBatchCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [inventoryHistoryData, setInventoryHistoryData] = useState<InventoryHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyActionType, setHistoryActionType] = useState<string>('all');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  
  // Get unique categories from products
  const productCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category))].filter(Boolean);
  }, [products]);

  const getDateRange = (preset: DatePreset, customStart: string, customEnd: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        return { start: today, end: now };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      }
      case 'tomorrow': {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);
        return { start: tomorrow, end: tomorrowEnd };
      }
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: now };
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo, end: now };
      }
      case 'year': {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return { start: yearAgo, end: now };
      }
      case 'custom':
        return {
          start: customStart ? new Date(customStart) : new Date(0),
          end: customEnd ? new Date(customEnd + 'T23:59:59') : new Date()
        };
      default:
        return { start: new Date(0), end: now };
    }
  };

  // Filter data by date range and salesman
  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange(datePreset, customStartDate, customEndDate);
    
    return sales.filter(s => {
      const saleDate = new Date(s.date);
      const dateMatch = saleDate >= start && saleDate <= end;
      
      if (selectedSalesman === 'all') return dateMatch;
      return dateMatch && (s.createdBy === selectedSalesman || s.salesmanId === selectedSalesman);
    });
  }, [sales, datePreset, customStartDate, customEndDate, selectedSalesman]);

  const filteredPurchases = useMemo(() => {
    const { start, end } = getDateRange(datePreset, customStartDate, customEndDate);
    return purchases.filter(p => {
      const purchaseDate = new Date(p.date);
      return purchaseDate >= start && purchaseDate <= end;
    });
  }, [purchases, datePreset, customStartDate, customEndDate]);

  const filteredExpenses = useMemo(() => {
    const { start, end } = getDateRange(datePreset, customStartDate, customEndDate);
    return expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= start && expenseDate <= end;
    });
  }, [expenses, datePreset, customStartDate, customEndDate]);

  // Get expired products
  const expiredProducts = useMemo(() => {
    const now = new Date();
    return products.filter(p => {
      if (p.expiryDate) {
        return new Date(p.expiryDate) < now;
      }
      return false;
    });
  }, [products]);

  // Get unique salesmen from sales data - include all user types
  const salesmenList = useMemo(() => {
    const salesmenSet = new Map<string, { id: string; name: string; role: string }>();
    
    // Add users from sales data
    sales.forEach(s => {
      const salesmanId = s.createdBy || s.salesmanId;
      if (salesmanId) {
        const user = users.find(u => u.id === salesmanId);
        const salesmanName = s.salesmanName || s.createdByName || user?.name || 'Unknown';
        const role = user?.role || 'Salesman';
        salesmenSet.set(salesmanId, { id: salesmanId, name: salesmanName, role });
      }
    });
    
    // Add all users who can make sales (Admin, Manager, Salesman, Staff)
    users.filter(u => ['Admin', 'Manager', 'Salesman', 'Staff'].includes(u.role)).forEach(u => {
      if (!salesmenSet.has(u.id)) {
        salesmenSet.set(u.id, { id: u.id, name: u.name, role: u.role });
      }
    });
    
    return Array.from(salesmenSet.values());
  }, [sales, users]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalPurchases = filteredPurchases.reduce((acc, p) => acc + p.total, 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalPaid = filteredSales.reduce((acc, s) => acc + s.paid, 0);
    const totalDue = filteredSales.reduce((acc, s) => acc + s.due, 0);
    const totalDiscount = filteredSales.reduce((acc, s) => acc + (s.cartDiscount || 0) + (s.itemDiscount || 0), 0);
    
    // Calculate profit
    const costOfGoods = filteredSales.reduce((acc, sale) => {
      let saleCost = 0;
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          saleCost += product.purchasePrice * item.quantity;
        }
      });
      return acc + saleCost;
    }, 0);
    
    const grossProfit = totalSales - costOfGoods;
    const netProfit = grossProfit - totalExpenses - totalDiscount;
    const totalRevenue = totalSales - totalExpenses;
    
    // Total items sold
    const totalItemsSold = filteredSales.reduce((acc, sale) => {
      return acc + sale.items.reduce((a, i) => a + i.quantity, 0);
    }, 0);
    
    // Total products quantity
    const totalProductQuantity = products.reduce((acc, p) => acc + p.stock, 0);
    
    // Low stock count
    const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
    const lowStockQuantity = products.filter(p => p.stock <= p.minStock && p.stock > 0).reduce((acc, p) => acc + p.stock, 0);
    
    // Out of stock
    const outOfStockCount = products.filter(p => p.stock <= 0).length;
    const outOfStockQuantity = 0;
    
    // Expired
    const expiredCount = expiredProducts.length;
    const expiredQuantity = expiredProducts.reduce((acc, p) => acc + p.stock, 0);
    
    // Top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName || item.name || 'Unknown', quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice || item.total || 0;
      });
    });
    
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Salesman performance with role display
    const salesmanStats: Record<string, {
      id: string;
      name: string;
      role: string;
      salesCount: number;
      totalRevenue: number;
      totalItems: number;
      avgOrderValue: number;
    }> = {};
    
    filteredSales.forEach(sale => {
      const salesmanId = sale.createdBy || sale.salesmanId || 'unknown';
      const user = users.find(u => u.id === salesmanId);
      const salesmanName = sale.salesmanName || sale.createdByName || user?.name || 'Unknown';
      const salesmanRole = user?.role || 'Salesman';
      
      if (!salesmanStats[salesmanId]) {
        salesmanStats[salesmanId] = {
          id: salesmanId,
          name: salesmanName,
          role: salesmanRole,
          salesCount: 0,
          totalRevenue: 0,
          totalItems: 0,
          avgOrderValue: 0,
        };
      }
      
      salesmanStats[salesmanId].salesCount++;
      salesmanStats[salesmanId].totalRevenue += sale.total;
      salesmanStats[salesmanId].totalItems += sale.items.reduce((a, i) => a + i.quantity, 0);
    });
    
    Object.values(salesmanStats).forEach(stats => {
      stats.avgOrderValue = stats.salesCount > 0 ? stats.totalRevenue / stats.salesCount : 0;
    });
    
    const salesmanPerformance = Object.values(salesmanStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Low stock items
    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    const outOfStockItems = products.filter(p => p.stock <= 0);
    
    // Count customers only from Customer Management (customers array)
    const customerCount = customers?.length || 0;
    
    // Count customers with due (unique customers who have unpaid sales)
    const customersWithDue = new Set<string>();
    filteredSales.forEach(sale => {
      if (sale.due > 0 && sale.customerName && sale.customerName !== 'Walk-in Customer') {
        customersWithDue.add(sale.customerName);
      }
    });
    const customersWithDueCount = customersWithDue.size;
    
    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      totalPaid,
      totalDue,
      totalDiscount,
      grossProfit,
      netProfit,
      totalRevenue,
      totalItemsSold,
      totalProductQuantity,
      lowStockCount,
      lowStockQuantity,
      outOfStockCount,
      outOfStockQuantity,
      expiredCount,
      expiredQuantity,
      topProducts,
      salesmanPerformance,
      lowStockItems,
      outOfStockItems,
      salesCount: filteredSales.length,
      purchasesCount: filteredPurchases.length,
      ordersCount: filteredSales.length + filteredPurchases.length,
      avgOrderValue: filteredSales.length > 0 ? totalSales / filteredSales.length : 0,
      customerCount,
      customersWithDueCount,
    };
  }, [filteredSales, filteredPurchases, filteredExpenses, products, users, expiredProducts, customers]);

  const formatCurrencyLocal = (amount: number) => `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
  
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Add audit log entry
  const addAuditLog = (transactionId: string, transactionType: 'sale' | 'purchase' | 'expense', action: 'created' | 'edited' | 'deleted' | 'viewed' | 'printed', details: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      transactionId,
      transactionType,
      action,
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'System',
      timestamp: new Date(),
      details,
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  // Get audit logs for a transaction
  const getAuditLogsForTransaction = (transactionId: string) => {
    return auditLogs.filter(log => log.transactionId === transactionId);
  };

  // Print transaction
  const handlePrint = (type: 'sale' | 'purchase' | 'expense', data: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let content = '';
    
    if (type === 'sale') {
      addAuditLog(data.id, 'sale', 'printed', `Printed invoice #${data.invoiceNumber || data.id.slice(0, 8)}`);
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice #${data.invoiceNumber || data.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #ccc; padding-bottom: 15px; }
            .header h1 { font-size: 24px; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .info { margin-bottom: 15px; }
            .info p { margin: 5px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 12px; }
            th { font-weight: bold; }
            .totals { margin-top: 15px; border-top: 2px dashed #ccc; padding-top: 10px; }
            .totals p { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .totals .total { font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #ccc; }
            .footer p { font-size: 11px; color: #666; margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DOKAN POS</h1>
            <p>Invoice</p>
          </div>
          <div class="info">
            <p><strong>Invoice:</strong> #${data.invoiceNumber || data.id.slice(0, 8)}</p>
            <p><strong>Date:</strong> ${formatDateTime(data.date)}</p>
            <p><strong>Customer:</strong> ${data.customerName || 'Walk-in Customer'}</p>
            <p><strong>Salesman:</strong> ${data.salesmanName || data.createdByName || 'System'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item: any) => `
                <tr>
                  <td>${item.productName || item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrencyLocal(item.unitPrice || item.price || 0)}</td>
                  <td>${formatCurrencyLocal(item.totalPrice || item.total || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <p><span>Subtotal:</span><span>${formatCurrencyLocal(data.subtotal || 0)}</span></p>
            ${data.cartDiscount > 0 ? `<p><span>Discount:</span><span>-${formatCurrencyLocal(data.cartDiscount)}</span></p>` : ''}
            <p class="total"><span>Total:</span><span>${formatCurrencyLocal(data.total)}</span></p>
            <p><span>Paid:</span><span>${formatCurrencyLocal(data.paid)}</span></p>
            ${data.due > 0 ? `<p><span>Due:</span><span>${formatCurrencyLocal(data.due)}</span></p>` : ''}
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Powered by Dokan POS Pro v6.1.0</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
        </html>
      `;
    } else if (type === 'purchase') {
      addAuditLog(data.id, 'purchase', 'printed', `Printed purchase #${data.purchaseNumber || data.id.slice(0, 8)}`);
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase #${data.purchaseNumber || data.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            h1 { font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DOKAN POS - Purchase</h1>
          </div>
          <p><strong>Purchase #:</strong> ${data.purchaseNumber || data.id.slice(0, 8)}</p>
          <p><strong>Date:</strong> ${formatDateTime(data.date)}</p>
          <p><strong>Supplier:</strong> ${data.supplierName}</p>
          <p><strong>Total:</strong> ${formatCurrencyLocal(data.total)}</p>
          <p><strong>Paid:</strong> ${formatCurrencyLocal(data.paid)}</p>
          <p><strong>Balance:</strong> ${formatCurrencyLocal(data.balance)}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
        </html>
      `;
    } else if (type === 'expense') {
      addAuditLog(data.id, 'expense', 'printed', `Printed expense #${data.id.slice(0, 8)}`);
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expense #${data.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            h1 { font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DOKAN POS - Expense</h1>
          </div>
          <p><strong>Expense #:</strong> ${data.id.slice(0, 8)}</p>
          <p><strong>Date:</strong> ${formatDateTime(data.date)}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Description:</strong> ${data.description || 'N/A'}</p>
          <p><strong>Amount:</strong> ${formatCurrencyLocal(data.amount)}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
        </html>
      `;
    }
    
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Open sale for editing
  const openSaleEditor = async (sale: Sale) => {
    try {
      const response = await fetch(`/api/sales/${sale.id}`);
      const fullSale = await response.json();
      
      // Store original quantities for stock limit calculation
      const originalQuantities: Record<string, number> = {};
      fullSale.items.forEach((item: SaleItem) => {
        originalQuantities[item.productId] = item.quantity;
      });
      setOriginalItemQuantities(originalQuantities);
      
      setEditingSale({
        id: fullSale.id,
        customerName: fullSale.customerName || 'Walk-in Customer',
        items: fullSale.items.map((item: SaleItem, idx: number) => ({
          ...item,
          tempId: `temp-${idx}-${Date.now()}`
        })),
        subtotal: fullSale.subtotal || 0,
        itemDiscount: fullSale.itemDiscount || 0,
        cartDiscount: fullSale.cartDiscount || 0,
        discountType: fullSale.discountType || 'flat',
        discountPercent: fullSale.discountPercent || 0,
        taxAmount: fullSale.taxAmount || 0,
        total: fullSale.total || 0,
        paid: fullSale.paid || 0,
        due: fullSale.due || 0,
        paymentMethod: fullSale.paymentMethod || 'Cash',
        notes: fullSale.notes || '',
        salesmanName: fullSale.salesmanName || fullSale.createdByName || 'Unknown',
        invoiceNumber: fullSale.invoiceNumber,
        date: fullSale.date,
      });
      setShowSaleEditor(true);
      addAuditLog(sale.id, 'sale', 'edited', `Editing invoice #${sale.invoiceNumber || sale.id.slice(0, 8)}`);
    } catch (error) {
      console.error('Error fetching sale:', error);
    }
  };

  // Calculate totals for editing sale
  const calculateEditingTotals = (sale: EditingSale) => {
    let subtotal = 0;
    let itemDiscount = 0;
    
    sale.items.forEach(item => {
      const qty = item.quantity || 1;
      const price = item.unitPrice || item.price || 0;
      const itemDiscountAmt = item.discount || 0;
      subtotal += qty * price;
      itemDiscount += itemDiscountAmt;
    });
    
    let cartDiscount = sale.cartDiscount || 0;
    if (sale.discountType === 'percent' && sale.discountPercent) {
      cartDiscount = (subtotal * sale.discountPercent) / 100;
    }
    
    const total = subtotal - itemDiscount - cartDiscount + (sale.taxAmount || 0);
    const due = total - sale.paid;
    
    return { subtotal, itemDiscount, cartDiscount, total, due };
  };

  // Update item in editing sale
  const updateEditingItem = (tempId: string, field: string, value: any) => {
    if (!editingSale) return;
    
    const updatedItems = editingSale.items.map(item => {
      if (item.tempId === tempId) {
        let updatedItem = { ...item, [field]: value };
        
        // Enforce stock limit for quantity changes
        if (field === 'quantity') {
          const product = products.find(p => p.id === item.productId);
          const originalQty = originalItemQuantities[item.productId] || 0;
          const currentStock = product?.stock || 0;
          // Max allowed = current stock + original quantity from this sale
          const maxAllowed = currentStock + originalQty;
          const minAllowed = 1;
          
          // Clamp quantity to allowed range
          const clampedQty = Math.max(minAllowed, Math.min(value, maxAllowed));
          updatedItem.quantity = clampedQty;
        }
        
        const qty = updatedItem.quantity || 1;
        const price = updatedItem.unitPrice || updatedItem.price || 0;
        const discount = updatedItem.discount || 0;
        updatedItem.totalPrice = (qty * price) - discount;
        updatedItem.total = updatedItem.totalPrice;
        return updatedItem;
      }
      return item;
    });
    
    const newSale = { ...editingSale, items: updatedItems };
    const totals = calculateEditingTotals(newSale);
    setEditingSale({ ...newSale, ...totals });
  };

  // Remove item from editing sale
  const removeEditingItem = (tempId: string) => {
    if (!editingSale) return;
    
    const updatedItems = editingSale.items.filter(item => item.tempId !== tempId);
    const newSale = { ...editingSale, items: updatedItems };
    const totals = calculateEditingTotals(newSale);
    setEditingSale({ ...newSale, ...totals });
  };

  // Add product to editing sale
  const addProductToSale = (product: Product) => {
    if (!editingSale) return;
    
    const existingItem = editingSale.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      updateEditingItem(existingItem.tempId!, 'quantity', (existingItem.quantity || 0) + 1);
    } else {
      const newItem: SaleItem & { tempId: string } = {
        tempId: `temp-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        price: product.salePrice,
        discount: 0,
        totalPrice: product.salePrice,
        total: product.salePrice,
      };
      
      const newSale = { ...editingSale, items: [...editingSale.items, newItem] };
      const totals = calculateEditingTotals(newSale);
      setEditingSale({ ...newSale, ...totals });
    }
    
    setSearchProduct('');
    setShowProductSearch(false);
  };

  // Save edited sale
  const saveEditedSale = async () => {
    if (!editingSale) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editingSale.customerName,
          items: editingSale.items,
          subtotal: editingSale.subtotal,
          itemDiscount: editingSale.itemDiscount,
          cartDiscount: editingSale.cartDiscount,
          discountType: editingSale.discountType,
          discountPercent: editingSale.discountPercent,
          taxAmount: editingSale.taxAmount,
          total: editingSale.total,
          paid: editingSale.paid,
          due: editingSale.due,
          paymentMethod: editingSale.paymentMethod,
          notes: editingSale.notes,
        }),
      });
      
      if (response.ok) {
        addAuditLog(editingSale.id, 'sale', 'edited', `Saved changes to invoice #${editingSale.invoiceNumber}`);
        setShowSaleEditor(false);
        setEditingSale(null);
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        const error = await response.json();
        alert('Error saving sale: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale');
    }
    setSaving(false);
  };

  // Delete sale
  const deleteSale = async (saleId: string, invoiceNumber?: string) => {
    if (!confirm(t('msg.confirm_delete'))) return;
    
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        addAuditLog(saleId, 'sale', 'deleted', `Deleted invoice #${invoiceNumber || saleId.slice(0, 8)}`);
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        const error = await response.json();
        alert('Error deleting sale: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale');
    }
  };

  // Delete purchase
  const deletePurchase = async (purchaseId: string, purchaseNumber?: string) => {
    if (!confirm(t('msg.confirm_delete'))) return;
    
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        addAuditLog(purchaseId, 'purchase', 'deleted', `Deleted purchase #${purchaseNumber || purchaseId.slice(0, 8)}`);
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        const error = await response.json();
        alert('Error deleting purchase: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Error deleting purchase');
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId: string) => {
    if (!confirm(t('msg.confirm_delete'))) return;
    
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        addAuditLog(expenseId, 'expense', 'deleted', `Deleted expense #${expenseId.slice(0, 8)}`);
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        const error = await response.json();
        alert('Error deleting expense: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
    }
  };

  // Handle return items
  const handleReturnItems = async () => {
    if (!returningSale) return;
    
    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    
    if (itemsToReturn.length === 0) {
      alert('Please select items to return');
      return;
    }
    
    setReturnLoading(true);
    try {
      const response = await fetch(`/api/sales/${returningSale.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToReturn,
          refundMethod,
          reason: 'Return from Reports',
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        addAuditLog(returningSale.id, 'sale', 'edited', `Returned ${itemsToReturn.length} items, Refund: ${formatCurrencyLocal(result.refundAmount)}`);
        setReturningSale(null);
        setReturnItems({});
        setRefundMethod('original');
        if (onDataRefresh) onDataRefresh();
        alert(`Return processed successfully! Refund: ${formatCurrencyLocal(result.refundAmount)}`);
      } else {
        alert('Error processing return: ' + result.error);
      }
    } catch (error) {
      console.error('Return error:', error);
      alert('Error processing return');
    } finally {
      setReturnLoading(false);
    }
  };

  // Handle add payment
  const handleAddPayment = async () => {
    if (!paymentSale || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    
    setPaymentLoading(true);
    try {
      const newPaid = paymentSale.paid + paymentAmount;
      const newDue = Math.max(0, paymentSale.total - newPaid);
      const paymentStatus = newDue <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';
      
      const response = await fetch(`/api/sales/${paymentSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paid: newPaid,
          due: newDue,
          paymentMethod,
          paymentNotes,
        }),
      });
      
      if (response.ok) {
        addAuditLog(paymentSale.id, 'sale', 'edited', `Added payment: ${formatCurrencyLocal(paymentAmount)} via ${paymentMethod}`);
        setPaymentSale(null);
        setPaymentAmount(0);
        setPaymentMethod('Cash');
        setPaymentNotes('');
        if (onDataRefresh) onDataRefresh();
        alert('Payment added successfully!');
      } else {
        const error = await response.json();
        alert('Error adding payment: ' + error.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error adding payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Print thermal receipt
  const printThermalReceipt = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    addAuditLog(sale.id, 'sale', 'printed', `Printed thermal receipt #${sale.invoiceNumber || sale.id.slice(0, 8)}`);
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${sale.invoiceNumber || sale.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 10px; max-width: 280px; margin: 0 auto; font-size: 12px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h1 { font-size: 18px; margin: 0; font-weight: bold; }
          .header p { margin: 3px 0; }
          .info { margin-bottom: 10px; }
          .info p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 3px 0; text-align: left; font-size: 11px; }
          th { font-weight: bold; border-bottom: 1px solid #000; }
          .right { text-align: right; }
          .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          .totals p { display: flex; justify-content: space-between; margin: 3px 0; }
          .totals .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; }
          .footer p { font-size: 10px; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DOKAN POS</h1>
          <p>*** RECEIPT ***</p>
        </div>
        <div class="info">
          <p><strong>Invoice:</strong> ${sale.invoiceNumber || sale.id.slice(0, 8)}</p>
          <p><strong>Date:</strong> ${formatDateTime(sale.date)}</p>
          <p><strong>Customer:</strong> ${sale.customerName || 'Walk-in'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${(item.productName || item.name || '').substring(0, 15)}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">${formatCurrencyLocal(item.unitPrice || item.price || 0)}</td>
                <td class="right">${formatCurrencyLocal(item.totalPrice || item.total || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><span>Subtotal:</span><span>${formatCurrencyLocal(sale.subtotal || 0)}</span></p>
          ${sale.cartDiscount > 0 ? `<p><span>Discount:</span><span>-${formatCurrencyLocal(sale.cartDiscount)}</span></p>` : ''}
          <p class="total"><span>TOTAL:</span><span>${formatCurrencyLocal(sale.total)}</span></p>
          <p><span>Paid:</span><span>${formatCurrencyLocal(sale.paid)}</span></p>
          ${sale.due > 0 ? `<p><span>Due:</span><span>${formatCurrencyLocal(sale.due)}</span></p>` : ''}
        </div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Dokan POS v6.1.0</p>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Check if user can modify transactions (Admin = master admin can do everything)
  const canModifyTransactions = currentUser?.role === 'Admin' || currentUser?.role === 'Master Admin' || currentUser?.role === 'Manager';

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <PieChart className="w-4 h-4" /> },
    { id: 'transactions', label: 'All Transactions', icon: <Layers className="w-4 h-4" /> },
    { id: 'sales', label: t('reports.sales_tab'), icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'salesman', label: t('reports.salesman_tab'), icon: <UserIcon className="w-4 h-4" /> },
    { id: 'purchases', label: t('reports.purchases_tab'), icon: <Truck className="w-4 h-4" /> },
    { id: 'inventory', label: t('reports.inventory_tab'), icon: <Package className="w-4 h-4" /> },
    { id: 'inventory-history', label: t('history.title'), icon: <History className="w-4 h-4" /> },
    { id: 'profit', label: t('reports.profit_tab'), icon: <DollarSign className="w-4 h-4" /> },
  ];
  
  // Fetch inventory history
  const fetchInventoryHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthFilter !== 'all') params.append('month', monthFilter);
      if (historyActionType !== 'all') params.append('actionType', historyActionType);
      if (historyDateFrom) params.append('dateFrom', historyDateFrom);
      if (historyDateTo) params.append('dateTo', historyDateTo);
      
      const res = await fetch(`/api/inventory-history?${params.toString()}`);
      const data = await res.json();
      setInventoryHistoryData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch inventory history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fix stock discrepancies
  const handleFixStock = async () => {
    if (!confirm('This will recalculate all product stocks based on purchases and sales. Continue?')) {
      return;
    }
    
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/fix-stock');
      const data = await res.json();
      
      if (data.success) {
        alert(`✓ ${data.message}\n\nFixed products:\n${data.updates.map((u: any) => `- ${u.name}: ${u.oldStock} → ${u.newStock}`).join('\n')}`);
        // Refresh history and products
        fetchInventoryHistory();
        onDataRefresh?.();
      } else {
        alert('Failed to fix stock: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to fix stock:', error);
      alert('Failed to fix stock. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Fetch history when tab or filters change
  useEffect(() => {
    if (activeTab === 'inventory-history') {
      fetchInventoryHistory();
    }
  }, [activeTab, monthFilter, historyActionType, historyDateFrom, historyDateTo]);
  
  // Filter inventory history
  const filteredInventoryHistory = useMemo(() => {
    let filtered = inventoryHistoryData;
    
    // Category filter
    if (categoryFilterMode === 'batch' && selectedBatchCategories.length > 0) {
      filtered = filtered.filter(h => {
        const product = products.find(p => p.id === h.productId);
        return product && selectedBatchCategories.includes(product.category);
      });
    } else if (categoryFilterMode === 'custom' && customCategoryInput) {
      filtered = filtered.filter(h => {
        const product = products.find(p => p.id === h.productId);
        return product && product.category.toLowerCase().includes(customCategoryInput.toLowerCase());
      });
    }
    
    return filtered;
  }, [inventoryHistoryData, categoryFilterMode, selectedBatchCategories, customCategoryInput, products]);
  
  // Calculate inventory history stats
  const inventoryHistoryStats = useMemo(() => {
    const added = filteredInventoryHistory.filter(h => h.actionType === 'added' || h.actionType === 'purchase').reduce((a, h) => a + h.quantityChange, 0);
    const sold = filteredInventoryHistory.filter(h => h.actionType === 'sold').reduce((a, h) => a + Math.abs(h.quantityChange), 0);
    const damaged = filteredInventoryHistory.filter(h => h.actionType === 'damaged').reduce((a, h) => a + Math.abs(h.quantityChange), 0);
    const adjusted = filteredInventoryHistory.filter(h => h.actionType === 'adjusted').reduce((a, h) => a + Math.abs(h.quantityChange), 0);
    const totalValue = filteredInventoryHistory.reduce((a, h) => a + h.totalPrice, 0);
    
    return { added, sold, damaged, adjusted, totalValue, totalEntries: filteredInventoryHistory.length };
  }, [filteredInventoryHistory]);

  const datePresets: { id: DatePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom Range' },
  ];

  // Filter products for search
  const filteredProducts = useMemo(() => {
    if (!searchProduct) return products.slice(0, 10);
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(searchProduct.toLowerCase())) ||
      (p.sku?.toLowerCase().includes(searchProduct.toLowerCase())) ||
      (p.barcode?.toLowerCase().includes(searchProduct.toLowerCase()))
    ).slice(0, 10);
  }, [products, searchProduct]);

  // Combined transactions
  const allTransactions = useMemo(() => {
    const transactions: Array<{
      id: string;
      type: 'sale' | 'purchase' | 'expense';
      date: Date;
      reference: string;
      party: string;
      amount: number;
      paid: number;
      due: number;
      status: string;
      rawData: any;
    }> = [];
    
    filteredSales.forEach(s => {
      transactions.push({
        id: s.id,
        type: 'sale',
        date: new Date(s.date),
        reference: s.invoiceNumber || s.id.slice(0, 8).toUpperCase(),
        party: s.customerName || 'Walk-in Customer',
        amount: s.total,
        paid: s.paid,
        due: s.due,
        status: s.paymentStatus || (s.due > 0 ? 'Due' : 'Paid'),
        rawData: s,
      });
    });
    
    filteredPurchases.forEach(p => {
      transactions.push({
        id: p.id,
        type: 'purchase',
        date: new Date(p.date),
        reference: p.purchaseNumber || p.id.slice(0, 8).toUpperCase(),
        party: p.supplierName,
        amount: p.total,
        paid: p.paid,
        due: p.balance,
        status: p.balance > 0 ? 'Due' : 'Paid',
        rawData: p,
      });
    });
    
    filteredExpenses.forEach(e => {
      transactions.push({
        id: e.id,
        type: 'expense',
        date: new Date(e.date),
        reference: e.id.slice(0, 8).toUpperCase(),
        party: e.category,
        amount: e.amount,
        paid: e.amount,
        due: 0,
        status: 'Paid',
        rawData: e,
      });
    });
    
    // Filter by type
    let filtered = transactions;
    if (transactionType !== 'all') {
      filtered = transactions.filter(t => t.type === transactionType);
    }
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.party.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by date
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredSales, filteredPurchases, filteredExpenses, transactionType, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{t('reports.title')}</h1>
              <p className="text-slate-500 text-sm">{t('reports.subtitle')} • v6.1.0 Pro</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onDataRefresh && (
            <button 
              onClick={onDataRefresh} 
              className="bg-white text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm border border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('common.refresh')}</span>
            </button>
          )}
          <button 
            onClick={() => setShowAuditLog(true)} 
            className="bg-white text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm border border-slate-200"
          >
            <History className="w-4 h-4" />
            <span>Audit Log</span>
          </button>
          <button 
            onClick={() => window.print()} 
            className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:from-slate-800 hover:to-slate-700 transition shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>{t('common.export')}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value as DatePreset);
                setShowDatePicker(e.target.value === 'custom');
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {datePresets.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {showDatePicker && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-slate-400 font-bold">→</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Salesman Filter */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-purple-600" />
            </div>
            <select
              value={selectedSalesman}
              onChange={(e) => setSelectedSalesman(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
            >
              <option value="all">{t('reports.all_salesmen')}</option>
              {salesmenList.map(salesman => (
                <option key={salesman.id} value={salesman.id}>
                  {salesman.name} ({salesman.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Total Sales */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <TrendingUp className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Sales</p>
              <p className="text-2xl font-black mt-1">{formatCurrencyLocal(stats.totalSales)}</p>
              <p className="text-xs text-white/60 mt-1">{stats.salesCount} orders</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <DollarSign className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-black mt-1">{formatCurrencyLocal(stats.totalRevenue)}</p>
              <p className="text-xs text-white/60 mt-1">{((stats.netProfit / (stats.totalSales || 1)) * 100).toFixed(1)}% margin</p>
            </div>

            {/* Total Purchase */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <Package className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Purchase</p>
              <p className="text-2xl font-black mt-1">{formatCurrencyLocal(stats.totalPurchases)}</p>
              <p className="text-xs text-white/60 mt-1">{stats.purchasesCount} orders</p>
            </div>

            {/* Net Profit */}
            <div className={`bg-gradient-to-br ${stats.netProfit >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white p-5 rounded-2xl shadow-xl ${stats.netProfit >= 0 ? 'shadow-green-500/20' : 'shadow-red-500/20'} hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                {stats.netProfit >= 0 ? <ArrowUpRight className="w-5 h-5 text-white/60" /> : <ArrowDownRight className="w-5 h-5 text-white/60" />}
              </div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Net Profit</p>
              <p className="text-2xl font-black mt-1">{formatCurrencyLocal(stats.netProfit)}</p>
              <p className="text-xs text-white/60 mt-1">After expenses</p>
            </div>

            {/* Customer Due */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/30 transition-all hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-5 h-5" />
                </div>
                <CreditCard className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Customer Due</p>
              <p className="text-2xl font-black mt-1">{formatCurrencyLocal(stats.totalDue)}</p>
              <p className="text-xs text-white/60 mt-1">{stats.customersWithDueCount} customers</p>
            </div>

            {/* Total Expenses */}
            <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-5 rounded-2xl shadow-xl shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/30 transition-all hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <DollarSign className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Expenses</p>
              <p className="text-2xl font-black mt-1">{formatCurrencyLocal(stats.totalExpenses)}</p>
              <p className="text-xs text-white/60 mt-1">{filteredExpenses.length} transactions</p>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Products */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Products</p>
                  <p className="text-2xl font-black text-slate-900">{products.length}</p>
                  <p className="text-xs text-slate-400">{stats.totalProductQuantity} items</p>
                </div>
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Low Stock</p>
                  <p className="text-2xl font-black text-orange-600">{stats.lowStockCount}</p>
                  <p className="text-xs text-slate-400">Need reorder</p>
                </div>
              </div>
            </div>

            {/* Out of Stock */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Out of Stock</p>
                  <p className="text-2xl font-black text-red-600">{stats.outOfStockCount}</p>
                  <p className="text-xs text-slate-400">Zero stock</p>
                </div>
              </div>
            </div>

            {/* Expired */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Clock3 className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Expired</p>
                  <p className="text-2xl font-black text-rose-600">{stats.expiredCount}</p>
                  <p className="text-xs text-slate-400">{stats.expiredQuantity} items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Orders</p>
                  <p className="text-2xl font-black text-slate-900">{stats.ordersCount}</p>
                  <p className="text-xs text-slate-400">This period</p>
                </div>
              </div>
            </div>

            {/* Items Sold */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Items Sold</p>
                  <p className="text-2xl font-black text-slate-900">{stats.totalItemsSold}</p>
                  <p className="text-xs text-slate-400">Units</p>
                </div>
              </div>
            </div>

            {/* Total Paid */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Paid</p>
                  <p className="text-2xl font-black text-green-600">{formatCurrencyLocal(stats.totalPaid)}</p>
                  <p className="text-xs text-slate-400">Received</p>
                </div>
              </div>
            </div>

            {/* Total Due */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Due</p>
                  <p className="text-2xl font-black text-red-600">{formatCurrencyLocal(stats.totalDue)}</p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Top Products
                </h3>
                <span className="text-xs text-slate-400">By Revenue</span>
              </div>
              <div className="space-y-3">
                {stats.topProducts.slice(0, 5).map((product, idx) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.quantity} sold</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-emerald-600">{formatCurrencyLocal(product.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-500" />
                  Top Performers
                </h3>
                <span className="text-xs text-slate-400">Salesmen</span>
              </div>
              <div className="space-y-3">
                {stats.salesmanPerformance.slice(0, 5).map((salesman, idx) => (
                  <div key={salesman.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                        idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {salesman.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{salesman.name}</p>
                        <p className="text-xs text-slate-400">{salesman.salesCount} sales</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-green-600">{formatCurrencyLocal(salesman.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
                >
                  <Layers className="w-5 h-5 text-blue-400" />
                  <span>View All Transactions</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span>Stock Alerts ({stats.lowStockCount + stats.outOfStockCount})</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <button 
                  onClick={() => setActiveTab('profit')}
                  className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
                >
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span>Profit Analysis</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <button 
                  onClick={() => setActiveTab('system')}
                  className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
                >
                  <Database className="w-5 h-5 text-purple-400" />
                  <span>System Info</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="sale">Sales</option>
                  <option value="purchase">Purchases</option>
                  <option value="expense">Expenses</option>
                </select>
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-medium">{allTransactions.length}</span> transactions found
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <p className="text-xs font-bold text-white/70 uppercase">Total Sales</p>
              <p className="text-xl font-black mt-1">{formatCurrencyLocal(filteredSales.reduce((a, s) => a + s.total, 0))}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl">
              <p className="text-xs font-bold text-white/70 uppercase">Total Purchases</p>
              <p className="text-xl font-black mt-1">{formatCurrencyLocal(filteredPurchases.reduce((a, p) => a + p.total, 0))}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl">
              <p className="text-xs font-bold text-white/70 uppercase">Total Expenses</p>
              <p className="text-xl font-black mt-1">{formatCurrencyLocal(filteredExpenses.reduce((a, e) => a + e.amount, 0))}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-xl">
              <p className="text-xs font-bold text-white/70 uppercase">Net Flow</p>
              <p className="text-xl font-black mt-1">{formatCurrencyLocal(
                filteredSales.reduce((a, s) => a + s.total, 0) - 
                filteredPurchases.reduce((a, p) => a + p.total, 0) - 
                filteredExpenses.reduce((a, e) => a + e.amount, 0)
              )}</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Party</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTransactions.map((transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          transaction.type === 'sale' ? 'bg-blue-100 text-blue-700' :
                          transaction.type === 'purchase' ? 'bg-purple-100 text-purple-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'sale' && <ShoppingCart className="w-3 h-3" />}
                          {transaction.type === 'purchase' && <Truck className="w-3 h-3" />}
                          {transaction.type === 'expense' && <Receipt className="w-3 h-3" />}
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-medium">#{transaction.reference}</td>
                      <td className="px-4 py-3 text-sm">{transaction.party}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrencyLocal(transaction.amount)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatCurrencyLocal(transaction.paid)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCurrencyLocal(transaction.due)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          transaction.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 flex-wrap min-w-[180px]">
                          {/* View - Always visible */}
                          <button
                            onClick={() => {
                              if (transaction.type === 'sale') {
                                setViewingSale(transaction.rawData);
                                addAuditLog(transaction.id, 'sale', 'viewed', `Viewed invoice #${transaction.reference}`);
                              } else if (transaction.type === 'purchase') {
                                setViewingPurchase(transaction.rawData);
                                addAuditLog(transaction.id, 'purchase', 'viewed', `Viewed purchase #${transaction.reference}`);
                              } else {
                                setViewingExpense(transaction.rawData);
                                addAuditLog(transaction.id, 'expense', 'viewed', `Viewed expense #${transaction.reference}`);
                              }
                            }}
                            className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Print Thermal Receipt (only for sales) */}
                          {transaction.type === 'sale' && (
                            <button
                              onClick={() => printThermalReceipt(transaction.rawData)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                              title="Print Thermal Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Edit (only for sales) */}
                          {transaction.type === 'sale' && canModifyTransactions && (
                            <button
                              onClick={() => openSaleEditor(transaction.rawData)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Payment (only for sales with due) */}
                          {transaction.type === 'sale' && transaction.due > 0 && canModifyTransactions && (
                            <button
                              onClick={() => {
                                setPaymentSale(transaction.rawData);
                                setPaymentAmount(transaction.due);
                              }}
                              className="p-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 transition"
                              title="Add Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Return (only for sales) */}
                          {transaction.type === 'sale' && canModifyTransactions && (
                            <button
                              onClick={() => {
                                setReturningSale(transaction.rawData);
                                setReturnItems({});
                              }}
                              className="p-2 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-600 transition"
                              title="Return Items"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Audit Log */}
                          <button
                            onClick={() => {
                              setSelectedTransactionForAudit(transaction.id);
                              setShowAuditLog(true);
                            }}
                            className="p-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-600 transition"
                            title="Audit Log"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          
                          {/* Delete */}
                          {canModifyTransactions && (
                            <button
                              onClick={() => {
                                if (transaction.type === 'sale') {
                                  deleteSale(transaction.id, transaction.reference);
                                } else if (transaction.type === 'purchase') {
                                  deletePurchase(transaction.id, transaction.reference);
                                } else {
                                  deleteExpense(transaction.id);
                                }
                              }}
                              className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.revenue')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatCurrencyLocal(stats.totalSales)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.orders')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{stats.salesCount}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Avg Order</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatCurrencyLocal(stats.avgOrderValue)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.paid')}</p>
              <p className="text-xl font-black text-green-600 mt-1">{formatCurrencyLocal(stats.totalPaid)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.due')}</p>
              <p className="text-xl font-black text-red-600 mt-1">{formatCurrencyLocal(stats.totalDue)}</p>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">{t('sales.title')}</h3>
              <span className="text-sm text-slate-500">{filteredSales.length} records</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">{t('sales.invoice')}</th>
                    <th className="px-4 py-3 text-left">{t('sales.customer')}</th>
                    <th className="px-4 py-3 text-left">{t('sales.salesman')}</th>
                    <th className="px-4 py-3 text-left">{t('common.date')}</th>
                    <th className="px-4 py-3 text-right">{t('common.total')}</th>
                    <th className="px-4 py-3 text-right">{t('common.paid')}</th>
                    <th className="px-4 py-3 text-center">{t('common.status')}</th>
                    <th className="px-4 py-3 text-center">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm">#{sale.invoiceNumber || sale.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm">{sale.customerName}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{sale.salesmanName || sale.createdByName || 'System'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(sale.date)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrencyLocal(sale.total)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatCurrencyLocal(sale.paid)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                          sale.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setViewingSale(sale);
                              addAuditLog(sale.id, 'sale', 'viewed', `Viewed invoice #${sale.invoiceNumber || sale.id.slice(0, 8)}`);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600"
                            title={t('sales.view_details')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canModifyTransactions && (
                            <>
                              <button
                                onClick={() => openSaleEditor(sale)}
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600"
                                title={t('sales.edit_sale')}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteSale(sale.id, sale.invoiceNumber)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"
                                title={t('sales.delete_sale')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Salesman Tab */}
      {activeTab === 'salesman' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Team Members</p>
              <p className="text-xl font-black text-slate-900 mt-1">{stats.salesmanPerformance.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.revenue')}</p>
              <p className="text-xl font-black text-green-600 mt-1">{formatCurrencyLocal(stats.totalSales)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Avg Per Salesman</p>
              <p className="text-xl font-black text-blue-600 mt-1">
                {formatCurrencyLocal(stats.salesmanPerformance.length > 0 ? stats.totalSales / stats.salesmanPerformance.length : 0)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.orders')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{stats.salesCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">{t('reports.salesman_tab')} {t('reports.overview')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">{t('common.name')}</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-right">{t('dashboard.orders')}</th>
                    <th className="px-4 py-3 text-right">{t('common.revenue')}</th>
                    <th className="px-4 py-3 text-right">{t('dashboard.items')}</th>
                    <th className="px-4 py-3 text-right">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.salesmanPerformance.map((salesman) => (
                    <tr key={salesman.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{salesman.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          salesman.role === 'Admin' ? 'bg-red-100 text-red-700' :
                          salesman.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                          salesman.role === 'Staff' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {salesman.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{salesman.salesCount}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrencyLocal(salesman.totalRevenue)}</td>
                      <td className="px-4 py-3 text-right">{salesman.totalItems}</td>
                      <td className="px-4 py-3 text-right">{formatCurrencyLocal(salesman.avgOrderValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('purchases.total_purchases')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{filteredPurchases.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('purchases.total_amount')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatCurrencyLocal(stats.totalPurchases)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('purchases.total_paid')}</p>
              <p className="text-xl font-black text-green-600 mt-1">{formatCurrencyLocal(filteredPurchases.reduce((a, p) => a + p.paid, 0))}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('purchases.total_due')}</p>
              <p className="text-xl font-black text-red-600 mt-1">{formatCurrencyLocal(filteredPurchases.reduce((a, p) => a + p.balance, 0))}</p>
            </div>
          </div>

          {/* Purchases List with Item Details */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                {t('purchases.title')} - Item Details
              </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredPurchases.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No purchases found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredPurchases.map((purchase) => {
                    // Parse items if it's a string
                    const purchaseItems = typeof purchase.items === 'string' 
                      ? JSON.parse(purchase.items) 
                      : (purchase.items || []);
                    
                    return (
                      <div key={purchase.id} className="p-4 hover:bg-slate-50/50">
                        {/* Purchase Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                              {purchase.supplierName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-lg">{purchase.supplierName || 'Unknown Supplier'}</p>
                              <p className="text-sm text-slate-500">
                                #{purchase.purchaseNumber || purchase.id.slice(0, 8).toUpperCase()} • {formatDate(purchase.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-2xl text-slate-800">{formatCurrencyLocal(purchase.total)}</p>
                              <p className="text-sm">
                                {purchase.balance > 0 ? (
                                  <span className="text-orange-600 font-medium">Due: {formatCurrencyLocal(purchase.balance)}</span>
                                ) : (
                                  <span className="text-green-600 font-medium">✓ Paid</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingPurchase(purchase)}
                                className="p-2.5 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 border border-transparent hover:border-blue-200"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Purchase Items - Main Focus */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <Package className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Items ({purchaseItems.length})</span>
                          </div>
                          
                          {purchaseItems.length === 0 ? (
                            <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 text-center text-slate-400">
                              No items in this purchase
                            </div>
                          ) : (
                            purchaseItems.map((item: any, idx: number) => {
                              const product = products.find(p => p.id === item.productId);
                              return (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                  {/* Product Image */}
                                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border-2 border-slate-200 shadow-inner">
                                    {product?.image ? (
                                      <img 
                                        src={product.image} 
                                        alt={item.productName || 'Product'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">{item.productName || 'Unknown Item'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      SKU: <span className="font-mono font-medium">{item.sku || product?.sku || 'N/A'}</span>
                                    </p>
                                  </div>
                                  
                                  {/* Quantity & Unit */}
                                  <div className="flex-shrink-0 text-center">
                                    <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-teal-100 text-teal-800">
                                      <span className="text-lg font-bold">{item.quantity}</span>
                                      <span className="text-sm ml-1 font-medium text-teal-600">{product?.unit || 'pc'}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Buy Price */}
                                  <div className="flex-shrink-0 text-center bg-blue-50 rounded-xl px-4 py-2 min-w-[90px]">
                                    <p className="text-[10px] text-blue-500 uppercase font-bold">Buy Price</p>
                                    <p className="text-base font-bold text-blue-700">{formatCurrencyLocal(item.unitPrice)}</p>
                                  </div>
                                  
                                  {/* Sell Price */}
                                  <div className="flex-shrink-0 text-center bg-green-50 rounded-xl px-4 py-2 min-w-[90px]">
                                    <p className="text-[10px] text-green-500 uppercase font-bold">Sell Price</p>
                                    <p className="text-base font-bold text-green-700">{formatCurrencyLocal(product?.salePrice || 0)}</p>
                                  </div>
                                  
                                  {/* Total */}
                                  <div className="flex-shrink-0 text-center bg-slate-100 rounded-xl px-4 py-2 min-w-[80px]">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
                                    <p className="text-base font-bold text-slate-800">{formatCurrencyLocal(item.totalPrice)}</p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('inventory.total_products')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{products.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('inventory.stock_value')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatCurrencyLocal(products.reduce((a, p) => a + p.stock * p.purchasePrice, 0))}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('inventory.low_stock_items')}</p>
              <p className="text-xl font-black text-orange-600 mt-1">{stats.lowStockItems.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('inventory.out_of_stock')}</p>
              <p className="text-xl font-black text-red-600 mt-1">{stats.outOfStockItems.length}</p>
            </div>
          </div>

          {stats.lowStockItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-orange-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t('inventory.low_stock_items')}
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">{t('inventory.product_name')}</th>
                      <th className="px-4 py-3 text-center">{t('inventory.stock')}</th>
                      <th className="px-4 py-3 text-center">{t('inventory.min_stock')}</th>
                      <th className="px-4 py-3 text-right">{t('inventory.purchase_price')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.lowStockItems.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{product.minStock}</td>
                        <td className="px-4 py-3 text-right">{formatCurrencyLocal(product.purchasePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expired Products */}
          {expiredProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-red-100 bg-red-50">
                <h3 className="font-bold text-red-600 flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  Expired Products
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Product Name</th>
                      <th className="px-4 py-3 text-center">Stock</th>
                      <th className="px-4 py-3 text-center">Expiry Date</th>
                      <th className="px-4 py-3 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expiredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-red-50">
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-red-600">{formatDate(product.expiryDate!)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrencyLocal(product.stock * product.purchasePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory History Tab */}
      {activeTab === 'inventory-history' && (
        <div className="space-y-6">
          {/* Filters Row */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Month Filter */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 min-w-[140px]"
                >
                  <option value="all">{t('month.all')}</option>
                  <option value="0">{t('month.january')}</option>
                  <option value="1">{t('month.february')}</option>
                  <option value="2">{t('month.march')}</option>
                  <option value="3">{t('month.april')}</option>
                  <option value="4">{t('month.may')}</option>
                  <option value="5">{t('month.june')}</option>
                  <option value="6">{t('month.july')}</option>
                  <option value="7">{t('month.august')}</option>
                  <option value="8">{t('month.september')}</option>
                  <option value="9">{t('month.october')}</option>
                  <option value="10">{t('month.november')}</option>
                  <option value="11">{t('month.december')}</option>
                </select>
              </div>

              {/* Action Type Filter */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <select
                  value={historyActionType}
                  onChange={(e) => setHistoryActionType(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">{t('filter.all')} {t('filter.action')}</option>
                  <option value="added">{t('history.added')}</option>
                  <option value="purchase">{t('history.purchase')}</option>
                  <option value="sold">{t('history.sold')}</option>
                  <option value="damaged">{t('history.damaged')}</option>
                  <option value="adjusted">{t('history.adjusted')}</option>
                  <option value="return">{t('history.return')}</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-600">{t('period.custom')}:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={historyDateFrom}
                  onChange={(e) => setHistoryDateFrom(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-slate-400 font-bold">→</span>
                <input
                  type="date"
                  value={historyDateTo}
                  onChange={(e) => setHistoryDateTo(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {(historyDateFrom || historyDateTo) && (
                <button
                  onClick={() => { setHistoryDateFrom(''); setHistoryDateTo(''); }}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  {t('common.clear')}
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-amber-600" />
                </div>
                <select
                  value={categoryFilterMode}
                  onChange={(e) => setCategoryFilterMode(e.target.value as 'all' | 'batch' | 'custom')}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">{t('filter.all')} {t('filter.category')}</option>
                  <option value="batch">{t('filter.batch')}</option>
                  <option value="custom">{t('filter.custom')}</option>
                </select>
              </div>

              {/* Batch Category Selection */}
              {categoryFilterMode === 'batch' && (
                <div className="flex flex-wrap gap-2">
                  {productCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedBatchCategories(prev => 
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedBatchCategories.includes(cat)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Category Input */}
              {categoryFilterMode === 'custom' && (
                <input
                  type="text"
                  placeholder={t('filter.enter_custom')}
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
                />
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs font-bold uppercase opacity-80">{t('history.added')}</span>
              </div>
              <p className="text-2xl font-black">{inventoryHistoryStats.added}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs font-bold uppercase opacity-80">{t('history.sold')}</span>
              </div>
              <p className="text-2xl font-black">{inventoryHistoryStats.sold}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase opacity-80">{t('history.damaged')}</span>
              </div>
              <p className="text-2xl font-black">{inventoryHistoryStats.damaged}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpDown className="w-5 h-5" />
                <span className="text-xs font-bold uppercase opacity-80">{t('history.adjusted')}</span>
              </div>
              <p className="text-2xl font-black">{inventoryHistoryStats.adjusted}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <FileBarChart className="w-5 h-5" />
                <span className="text-xs font-bold uppercase opacity-80">{t('history.total_entries')}</span>
              </div>
              <p className="text-2xl font-black">{inventoryHistoryStats.totalEntries}</p>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                {t('history.title')}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFixStock}
                  className="text-sm bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                >
                  <Wrench className="w-4 h-4" />
                  Fix Stock
                </button>
                <button
                  onClick={fetchInventoryHistory}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('common.refresh')}
                </button>
              </div>
            </div>
            
            {historyLoading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500">{t('msg.loading')}</p>
              </div>
            ) : filteredInventoryHistory.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{t('history.no_history')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">{t('common.date')}</th>
                      <th className="px-4 py-3 text-center">Image</th>
                      <th className="px-4 py-3 text-left">{t('inventory.product_name')}</th>
                      <th className="px-4 py-3 text-center">{t('filter.action')}</th>
                      <th className="px-4 py-3 text-center">{t('history.previous')}</th>
                      <th className="px-4 py-3 text-center">{t('history.change')}</th>
                      <th className="px-4 py-3 text-center">{t('history.new_stock')}</th>
                      <th className="px-4 py-3 text-right">{t('common.amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredInventoryHistory.map((entry) => {
                      const actionColors: Record<string, string> = {
                        added: 'bg-green-100 text-green-700',
                        purchase: 'bg-green-100 text-green-700',
                        sold: 'bg-blue-100 text-blue-700',
                        damaged: 'bg-red-100 text-red-700',
                        adjusted: 'bg-orange-100 text-orange-700',
                        return: 'bg-purple-100 text-purple-700',
                      };
                      
                      // Get product image from entry or products array
                      const product = products.find(p => p.id === entry.productId);
                      const productImage = entry.image || product?.image || product?.imageUrl;
                      
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDateTime(entry.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border-2 border-slate-200 shadow-inner">
                                {productImage ? (
                                  <img 
                                    src={productImage} 
                                    alt={entry.productName || 'Product'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900">{entry.productName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-slate-400">{entry.sku}</p>
                                {entry.category && (
                                  <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{entry.category}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${actionColors[entry.actionType] || 'bg-slate-100 text-slate-700'}`}>
                              {t(`history.${entry.actionType}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-8 bg-slate-100 rounded-lg text-sm font-bold text-slate-700">
                              {entry.previousStock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {entry.quantityChange > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`font-bold ${entry.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-bold ${
                                entry.newStock <= 0 ? 'bg-red-100 text-red-700' :
                                entry.newStock <= 5 ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {entry.newStock}
                              </span>
                              {entry.stockVerified && entry.transactionIndex === entry.totalTransactions && (
                                <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrencyLocal(entry.totalPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profit Tab */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.revenue')}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatCurrencyLocal(stats.totalSales)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.profit')} (Gross)</p>
              <p className="text-xl font-black text-green-600 mt-1">{formatCurrencyLocal(stats.grossProfit)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.expense')}</p>
              <p className="text-xl font-black text-red-600 mt-1">{formatCurrencyLocal(stats.totalExpenses)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('common.profit')} (Net)</p>
              <p className="text-xl font-black text-green-600 mt-1">{formatCurrencyLocal(stats.netProfit)}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="font-bold text-lg mb-4">{t('reports.profit_tab')} {t('reports.overview')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">{t('common.revenue')}</p>
                <p className="text-2xl font-black">{formatCurrencyLocal(stats.totalSales)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">COGS</p>
                <p className="text-2xl font-black">{formatCurrencyLocal(stats.totalSales - stats.grossProfit)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">{t('common.expense')}</p>
                <p className="text-2xl font-black">{formatCurrencyLocal(stats.totalExpenses)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">{t('common.profit')}</p>
                <p className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrencyLocal(stats.netProfit)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Editor Modal */}
      {showSaleEditor && editingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8 max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t('sales.edit_sale')}</h2>
                  <p className="text-sm text-slate-500">#{editingSale.invoiceNumber}</p>
                </div>
                <button onClick={() => { setShowSaleEditor(false); setEditingSale(null); }} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Customer */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('sales.customer')}</label>
                  <input 
                    type="text" 
                    value={editingSale.customerName} 
                    onChange={(e) => setEditingSale({ ...editingSale, customerName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Add Products Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-700">{t('inventory.add_product')}</h3>
                    <button
                      onClick={() => setShowProductSearch(!showProductSearch)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-bold"
                    >
                      <Plus className="w-4 h-4" />
                      {t('common.add')}
                    </button>
                  </div>
                  
                  {showProductSearch && (
                    <div className="relative mb-3">
                      <input
                        type="text"
                        placeholder={t('common.search') + "..."}
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                      />
                      {searchProduct && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                          {filteredProducts.slice(0, 6).map(product => (
                            <button
                              key={product.id}
                              onClick={() => addProductToSale(product)}
                              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-left"
                            >
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-slate-400">{t('inventory.sku')}: {product.sku}</p>
                              </div>
                              <span className="text-sm font-bold text-blue-600">{formatCurrencyLocal(product.salePrice)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div>
                  <h3 className="font-bold text-slate-700 mb-3">{t('common.items')} ({editingSale.items.length})</h3>
                  
                  {editingSale.items.length > 0 ? (
                    <div className="space-y-3">
                      {editingSale.items.map((item) => (
                        <div key={item.tempId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 truncate">{item.productName || item.name}</p>
                            </div>
                            <button
                              onClick={() => removeEditingItem(item.tempId!)}
                              className="text-slate-400 hover:text-red-500 transition p-1"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            {/* Quantity */}
                            <div>
                              <label className="text-xs text-slate-500 block mb-1">
                                {t('common.quantity')}
                                {(() => {
                                  const product = products.find(p => p.id === item.productId);
                                  const originalQty = originalItemQuantities[item.productId] || 0;
                                  const currentStock = product?.stock || 0;
                                  const maxAllowed = currentStock + originalQty;
                                  return (
                                    <span className="text-orange-500 ml-1">
                                      (Max: {maxAllowed})
                                    </span>
                                  );
                                })()}
                              </label>
                              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                <button
                                  onClick={() => updateEditingItem(item.tempId!, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                                  className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-slate-600 font-bold hover:bg-slate-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity || 1}
                                  onChange={(e) => updateEditingItem(item.tempId!, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-full text-center bg-transparent outline-none font-bold text-sm"
                                />
                                <button
                                  onClick={() => updateEditingItem(item.tempId!, 'quantity', (item.quantity || 1) + 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-slate-800 text-white rounded-md font-bold hover:bg-slate-700"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Unit Price */}
                            <div>
                              <label className="text-xs text-slate-500 block mb-1">{t('common.unit_price')}</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice || item.price || 0}
                                onChange={(e) => updateEditingItem(item.tempId!, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500"
                              />
                            </div>
                            
                            {/* Total */}
                            <div>
                              <label className="text-xs text-slate-500 block mb-1">{t('common.total')}</label>
                              <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700">
                                {formatCurrencyLocal(item.totalPrice || item.total || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 font-medium">{t('msg.no_data')}</p>
                    </div>
                  )}
                </div>

                {/* Discount and Paid Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('common.discount')} ({CURRENCY_SYMBOL})</label>
                    <input 
                      type="number" 
                      value={editingSale.cartDiscount || 0} 
                      onChange={(e) => {
                        const newCartDiscount = Number(e.target.value);
                        const totals = calculateEditingTotals({ ...editingSale, cartDiscount: newCartDiscount });
                        setEditingSale({ ...editingSale, cartDiscount: newCartDiscount, ...totals });
                      }} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('pos.amount_paid')} ({CURRENCY_SYMBOL})</label>
                    <input 
                      type="number" 
                      value={editingSale.paid || 0} 
                      onChange={(e) => {
                        const newPaid = Number(e.target.value);
                        const newDue = editingSale.total - newPaid;
                        setEditingSale({ ...editingSale, paid: newPaid, due: Math.max(0, newDue) });
                      }} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" 
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-xl">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('common.subtotal')}</p>
                      <p className="text-xl font-black">{formatCurrencyLocal(editingSale.subtotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('common.discount')}</p>
                      <p className="text-xl font-black text-red-400">-{formatCurrencyLocal(editingSale.cartDiscount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('common.total')}</p>
                      <p className="text-xl font-black">{formatCurrencyLocal(editingSale.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('common.due')}</p>
                      <p className="text-xl font-black text-orange-400">{formatCurrencyLocal(editingSale.due)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-sm">{t('sales.salesman')}: {editingSale.salesmanName}</span>
                    <span className="text-sm text-slate-400">{editingSale.items.length} {t('common.items')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t flex gap-3 sticky bottom-0">
              <button 
                onClick={() => { setShowSaleEditor(false); setEditingSale(null); }} 
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={saveEditedSale} 
                disabled={saving || editingSale.items.length === 0}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:from-emerald-600 hover:to-teal-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('msg.loading')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Sale Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-bold">{t('sales.invoice')} #{viewingSale.invoiceNumber || viewingSale.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-slate-500">{formatDateTime(viewingSale.date)}</p>
              </div>
              <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-4">
                <p className="text-sm text-slate-600"><strong>{t('sales.customer')}:</strong> {viewingSale.customerName}</p>
                <p className="text-sm text-slate-600"><strong>{t('sales.salesman')}:</strong> {viewingSale.salesmanName || viewingSale.createdByName || 'System'}</p>
                <p className="text-sm text-slate-600"><strong>Payment:</strong> {viewingSale.paymentMethod || 'Cash'}</p>
              </div>
              
              <div className="border-t border-slate-100 pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase">
                      <th className="text-left py-2">{t('common.items')}</th>
                      <th className="text-center py-2">{t('common.quantity')}</th>
                      <th className="text-right py-2">{t('common.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSale.items.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2">{item.productName || item.name}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrencyLocal(item.totalPrice || item.total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('common.subtotal')}</span>
                  <span>{formatCurrencyLocal(viewingSale.subtotal)}</span>
                </div>
                {(viewingSale.cartDiscount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>{t('common.discount')}</span>
                    <span>-{formatCurrencyLocal(viewingSale.cartDiscount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('common.total')}</span>
                  <span>{formatCurrencyLocal(viewingSale.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">{t('common.paid')}</span>
                  <span className="text-green-600">{formatCurrencyLocal(viewingSale.paid)}</span>
                </div>
                {viewingSale.due > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">{t('common.due')}</span>
                    <span className="text-red-600">{formatCurrencyLocal(viewingSale.due)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-2">
              {canModifyTransactions && (
                <button
                  onClick={() => {
                    setViewingSale(null);
                    openSaleEditor(viewingSale);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-violet-50">
              <div>
                <h2 className="text-lg font-bold">Purchase #{viewingPurchase.purchaseNumber || viewingPurchase.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-slate-500">{formatDateTime(viewingPurchase.date)}</p>
              </div>
              <button onClick={() => setViewingPurchase(null)} className="p-2 hover:bg-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-600"><strong>Supplier:</strong> {viewingPurchase.supplierName}</p>
              <p className="text-sm text-slate-600"><strong>Total:</strong> {formatCurrencyLocal(viewingPurchase.total)}</p>
              <p className="text-sm text-slate-600"><strong>Paid:</strong> <span className="text-green-600">{formatCurrencyLocal(viewingPurchase.paid)}</span></p>
              <p className="text-sm text-slate-600"><strong>Balance:</strong> <span className="text-red-600">{formatCurrencyLocal(viewingPurchase.balance)}</span></p>
              {viewingPurchase.notes && (
                <p className="text-sm text-slate-600"><strong>Notes:</strong> {viewingPurchase.notes}</p>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <button
                onClick={() => setViewingPurchase(null)}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-violet-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-red-50 to-rose-50">
              <div>
                <h2 className="text-lg font-bold">Expense #{viewingExpense.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-slate-500">{formatDateTime(viewingExpense.date)}</p>
              </div>
              <button onClick={() => setViewingExpense(null)} className="p-2 hover:bg-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-600"><strong>Category:</strong> {viewingExpense.category}</p>
              <p className="text-sm text-slate-600"><strong>Amount:</strong> <span className="text-red-600">{formatCurrencyLocal(viewingExpense.amount)}</span></p>
              {viewingExpense.description && (
                <p className="text-sm text-slate-600"><strong>Description:</strong> {viewingExpense.description}</p>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <button
                onClick={() => setViewingExpense(null)}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Audit Log</h2>
                  <p className="text-sm text-slate-400">Transaction History</p>
                </div>
              </div>
              <button onClick={() => setShowAuditLog(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs
                    .filter(log => !selectedTransactionForAudit || log.transactionId === selectedTransactionForAudit)
                    .map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        log.action === 'created' ? 'bg-green-100 text-green-600' :
                        log.action === 'edited' ? 'bg-blue-100 text-blue-600' :
                        log.action === 'deleted' ? 'bg-red-100 text-red-600' :
                        log.action === 'viewed' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {log.action === 'created' && <Plus className="w-4 h-4" />}
                        {log.action === 'edited' && <Edit className="w-4 h-4" />}
                        {log.action === 'deleted' && <Trash2 className="w-4 h-4" />}
                        {log.action === 'viewed' && <Eye className="w-4 h-4" />}
                        {log.action === 'printed' && <Printer className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm capitalize">{log.action}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-200 rounded-full text-slate-600">{log.transactionType}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{log.details}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>{log.userName}</span>
                          <span>•</span>
                          <span>{formatDateTime(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No audit logs yet</p>
                  <p className="text-slate-400 text-sm">Actions will be recorded here</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t">
              <button
                onClick={() => {
                  setShowAuditLog(false);
                  setSelectedTransactionForAudit(null);
                }}
                className="w-full py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Items Modal */}
      {returningSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-orange-50 sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Return Items</h2>
                <p className="text-sm text-slate-500">Invoice #{returningSale.invoiceNumber || returningSale.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => { setReturningSale(null); setReturnItems({}); setRefundMethod('original'); }}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <p className="text-sm text-slate-500 mb-4">Select items and quantities to return. Stock will be restored.</p>
              <div className="space-y-3">
                {returningSale.items.map((item: any) => (
                  <div key={item.productId} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.productName || item.name}</p>
                      <p className="text-sm text-slate-500">Purchased: {item.quantity} | {formatCurrencyLocal(item.unitPrice || item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                        <button
                          onClick={() => setReturnItems(prev => ({
                            ...prev,
                            [item.productId]: Math.max(0, (prev[item.productId] || 0) - 1)
                          }))}
                          className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-md hover:bg-slate-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold">{returnItems[item.productId] || 0}</span>
                        <button
                          onClick={() => setReturnItems(prev => ({
                            ...prev,
                            [item.productId]: Math.min(item.quantity, (prev[item.productId] || 0) + 1)
                          }))}
                          className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-md hover:bg-orange-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-slate-500 w-16 text-right">
                        Max: {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Return Summary */}
              {Object.values(returnItems).some(qty => qty > 0) && (
                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <h4 className="font-bold text-sm text-orange-800 mb-2">Return Summary</h4>
                  <p className="text-sm text-orange-600">
                    Total items to return: {Object.values(returnItems).reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-sm text-orange-600">
                    Estimated refund: {formatCurrencyLocal(Object.entries(returnItems)
                      .reduce((total, [productId, qty]) => {
                        const item = returningSale.items.find((i: any) => i.productId === productId);
                        return total + (item ? qty * (item.unitPrice || item.price) : 0);
                      }, 0))}
                  </p>
                  
                  {/* Refund Method Selection */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-orange-800">Refund Method</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'original', label: 'Original' },
                        { id: 'cash', label: 'Cash' },
                        { id: 'store_credit', label: 'Store Credit' },
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => setRefundMethod(option.id as typeof refundMethod)}
                          className={`p-2 rounded-lg border-2 text-xs font-bold transition-all ${
                            refundMethod === option.id
                              ? 'border-orange-500 bg-orange-100 text-orange-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t flex gap-3 sticky bottom-0">
              <button
                onClick={() => { setReturningSale(null); setReturnItems({}); setRefundMethod('original'); }}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnItems}
                disabled={!Object.values(returnItems).some(qty => qty > 0) || returnLoading}
                className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {returnLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Return'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Payment</h2>
                  <p className="text-sm text-slate-500">Invoice #{paymentSale.invoiceNumber || paymentSale.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => { setPaymentSale(null); setPaymentAmount(0); setPaymentMethod('Cash'); setPaymentNotes(''); }}
                  className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status */}
              <div className="grid grid-cols-3 gap-4 text-center bg-slate-900 text-white p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                  <p className="text-lg font-black">{formatCurrencyLocal(paymentSale.total)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Paid</p>
                  <p className="text-lg font-black text-green-400">{formatCurrencyLocal(paymentSale.paid)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Due</p>
                  <p className="text-lg font-black text-red-400">{formatCurrencyLocal(paymentSale.due)}</p>
                </div>
              </div>

              {/* Quick Pay Full */}
              <button
                onClick={() => setPaymentAmount(paymentSale.due)}
                className="w-full p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 hover:bg-green-100 transition-all"
              >
                Pay Full Amount ({formatCurrencyLocal(paymentSale.due)})
              </button>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold"
                  max={paymentSale.due}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'Card', 'Mobile'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        paymentMethod === method
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => { setPaymentSale(null); setPaymentAmount(0); setPaymentMethod('Cash'); setPaymentNotes(''); }}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={paymentAmount <= 0 || paymentLoading}
                className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Add ${formatCurrencyLocal(paymentAmount)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
