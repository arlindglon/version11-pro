'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Sale, SaleItem, Customer, Product, AuditLog, SalePayment, Purchase, Supplier } from '@/types';
import {
  Eye,
  Edit,
  Trash2,
  Printer,
  Plus,
  Minus,
  X,
  RotateCcw,
  CreditCard,
  History,
  Filter,
  Calendar,
  Users,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Ban,
  Receipt,
  Truck,
  Building2,
  ShoppingBag,
  ShoppingCart
} from 'lucide-react';
import { printCompactMemo, quickPrintReceipt } from '@/lib/printMemo';
import { printWithTemplate, quickThermalPrint, getDefaultTemplate, getTemplateByPaperSize, printPurchaseWithTemplate, quickThermalPrintPurchase } from '@/lib/printTemplates';
import { formatCurrency, CURRENCY_SYMBOL } from '@/contexts/LanguageContext';
import PrintReceipt from '@/components/dokan/PrintReceipt';

interface Props {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  purchases?: Purchase[];
  suppliers?: Supplier[];
  onDeleteSale: (id: string, restoreStock?: boolean) => void;
  onUpdateSale: (id: string, sale: Partial<Sale>, auditLog?: Partial<AuditLog>) => void;
  onAddPayment?: (saleId: string, payment: SalePayment) => void;
  onReturnItems?: (saleId: string, items: { productId: string; quantity: number }[]) => void;
  onDeletePurchase?: (id: string) => void;
  onUpdatePurchase?: (id: string, purchase: Partial<Purchase>, auditLog?: Partial<AuditLog>) => void;
  settings: {
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    shopContact?: string;
    shopBio?: string;
    currencySymbol?: string;
    receiptFooter?: string;
  } | null;
  currentUserRole?: string;
  currentUserPermissions?: Record<string, boolean>;
}

interface SaleWithAudit extends Sale {
  auditLogs?: AuditLog[];
}

const SalesHistory: React.FC<Props> = ({
  sales,
  products,
  customers,
  purchases = [],
  suppliers = [],
  onDeleteSale,
  onUpdateSale,
  onAddPayment,
  onReturnItems,
  onDeletePurchase,
  onUpdatePurchase,
  settings,
  currentUserRole,
  currentUserPermissions
}) => {
  // Ensure purchases, suppliers and sales are arrays
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeSales = Array.isArray(sales) ? sales : [];
  
  // Permission checks - ONLY Master Admin has full access, all others need explicit permissions
  const isMasterAdmin = currentUserRole === 'Master Admin';
  const canViewSales = isMasterAdmin || currentUserPermissions?.sales_view === true;
  const canViewPurchases = isMasterAdmin || currentUserPermissions?.purchases_view === true;
  const canEditSales = isMasterAdmin || currentUserPermissions?.sales_edit === true;
  const canDeleteSales = isMasterAdmin || currentUserPermissions?.sales_delete === true;
  const canReturnSales = isMasterAdmin || currentUserPermissions?.sales_return === true;
  const canEditPurchases = isMasterAdmin || currentUserPermissions?.purchases_edit === true;
  const canDeletePurchases = isMasterAdmin || currentUserPermissions?.purchases_delete === true;
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  
  // Auto-switch tab if current tab is not accessible
  useEffect(() => {
    if (activeTab === 'sales' && !canViewSales && canViewPurchases) {
      setActiveTab('purchases');
    } else if (activeTab === 'purchases' && !canViewPurchases && canViewSales) {
      setActiveTab('sales');
    }
  }, [canViewSales, canViewPurchases, activeTab]);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [viewingSale, setViewingSale] = useState<SaleWithAudit | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [auditSale, setAuditSale] = useState<SaleWithAudit | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Purchase modal states
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null);
  const [auditPurchase, setAuditPurchase] = useState<Purchase | null>(null);
  const [purchaseAuditLogs, setPurchaseAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingPurchaseAudit, setIsLoadingPurchaseAudit] = useState(false);
  const [purchasePayment, setPurchasePayment] = useState({ amount: 0, method: 'Cash', notes: '' });

  // Build audit logs from sale record's history and payments arrays
  useEffect(() => {
    if (!auditSale) {
      setAuditLogs([]);
      return;
    }
    setIsLoadingAudit(true);
    
    try {
      const logs: AuditLog[] = [];
      
      // Add creation entry
      logs.push({
        id: `create-${auditSale.id}`,
        entityType: 'Sale',
        entityId: auditSale.id,
        action: 'create',
        notes: 'Initial creation of the sale',
        createdAt: auditSale.createdAt,
        userName: auditSale.createdBy,
      });
      
      // Add history entries if available
      if (auditSale.history && auditSale.history.length > 0) {
        auditSale.history.forEach((entry) => {
          logs.push({
            id: entry.id,
            entityType: 'Sale',
            entityId: auditSale.id,
            action: entry.action as any,
            notes: entry.notes || entry.description,
            newData: entry.amount ? { amount: entry.amount, paymentMethod: entry.paymentMethod } : undefined,
            createdAt: entry.createdAt,
            userName: entry.userName,
          });
        });
      }
      
      // Add payment entries from payments array
      if (auditSale.payments && auditSale.payments.length > 0) {
        auditSale.payments.forEach((payment) => {
          logs.push({
            id: payment.id || `payment-${Date.now()}`,
            entityType: 'Sale',
            entityId: auditSale.id,
            action: 'payment',
            notes: `${formatCurrency(payment.amount)} via ${payment.paymentMethod}${payment.notes ? ` - ${payment.notes}` : ''}`,
            newData: { amount: payment.amount, paymentMethod: payment.paymentMethod },
            createdAt: payment.createdAt || new Date(),
            userName: 'System',
          });
        });
      }
      
      // Sort by date descending (newest first)
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to build audit logs:', error);
      setAuditLogs([]);
    } finally {
      setIsLoadingAudit(false);
    }
  }, [auditSale]);

  // Build audit logs from purchase record's history and payments arrays
  useEffect(() => {
    if (!auditPurchase) {
      setPurchaseAuditLogs([]);
      return;
    }
    setIsLoadingPurchaseAudit(true);
    
    try {
      const logs: AuditLog[] = [];
      
      // Add creation entry
      logs.push({
        id: `create-${auditPurchase.id}`,
        entityType: 'Purchase',
        entityId: auditPurchase.id,
        action: 'create',
        notes: 'Initial creation of the purchase order',
        createdAt: auditPurchase.createdAt,
        userName: auditPurchase.createdBy,
      });
      
      // Add history entries if available
      if (auditPurchase.history && auditPurchase.history.length > 0) {
        auditPurchase.history.forEach((entry) => {
          logs.push({
            id: entry.id,
            entityType: 'Purchase',
            entityId: auditPurchase.id,
            action: entry.action as any,
            notes: entry.notes || entry.description,
            newData: entry.amount ? { amount: entry.amount, paymentMethod: entry.paymentMethod } : undefined,
            createdAt: entry.createdAt,
            userName: entry.userName,
          });
        });
      }
      
      // Add payment entries from payments array
      if (auditPurchase.payments && auditPurchase.payments.length > 0) {
        auditPurchase.payments.forEach((payment) => {
          logs.push({
            id: payment.id || `payment-${Date.now()}`,
            entityType: 'Purchase',
            entityId: auditPurchase.id,
            action: 'payment',
            notes: `${formatCurrency(payment.amount)} via ${payment.paymentMethod}${payment.notes ? ` - ${payment.notes}` : ''}`,
            newData: { amount: payment.amount, paymentMethod: payment.paymentMethod },
            createdAt: payment.createdAt || new Date(),
            userName: 'System',
          });
        });
      }
      
      // Sort by date descending (newest first)
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setPurchaseAuditLogs(logs);
    } catch (error) {
      console.error('Failed to build purchase audit logs:', error);
      setPurchaseAuditLogs([]);
    } finally {
      setIsLoadingPurchaseAudit(false);
    }
  }, [auditPurchase]);

  // Return items state
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});

  // Additional payment state
  const [additionalPayment, setAdditionalPayment] = useState<{ amount: number; method: string; notes: string }>({
    amount: 0,
    method: 'Cash',
    notes: ''
  });
  
  // Print dialog state
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [printPurchase, setPrintPurchase] = useState<Purchase | null>(null);
  const [printDialogType, setPrintDialogType] = useState<'sale' | 'purchase'>('sale');

  // Safe date parser helper - defined before use
  const safeDate = (dateValue: unknown): Date | null => {
    if (!dateValue) return null;
    try {
      const d = new Date(dateValue as string);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    let result = [...sales];

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(s => new Date(s.date) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(s => new Date(s.date) <= toDate);
    }

    // Customer filter
    if (customerFilter !== 'all') {
      result = result.filter(s => s.customerId === customerFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      result = result.filter(s => s.paymentStatus === paymentStatusFilter);
    }

    // Sort by date descending
    return result.sort((a, b) => {
      const dateA = safeDate(a.date);
      const dateB = safeDate(b.date);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [sales, dateFrom, dateTo, customerFilter, paymentStatusFilter]);

  // Group sales by date
  const groupedSales = useMemo(() => {
    const groups: Record<string, { sales: Sale[]; dailyTotal: number }> = {};
    filteredSales.forEach(sale => {
      const date = safeDate(sale.date);
      const dateKey = date ? date.toISOString().split('T')[0] : 'unknown-date';
      if (!groups[dateKey]) groups[dateKey] = { sales: [], dailyTotal: 0 };
      groups[dateKey].sales.push(sale);
      groups[dateKey].dailyTotal += sale.total || 0;
    });
    return groups;
  }, [filteredSales]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    let result = [...safePurchases];

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(p => new Date(p.date) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.date) <= toDate);
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      result = result.filter(p => p.supplierId === supplierFilter);
    }

    // Sort by date descending
    return result.sort((a, b) => {
      const dateA = safeDate(a.date);
      const dateB = safeDate(b.date);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [safePurchases, dateFrom, dateTo, supplierFilter]);

  // Group purchases by date
  const groupedPurchases = useMemo(() => {
    const groups: Record<string, { purchases: Purchase[]; dailyTotal: number }> = {};
    filteredPurchases.forEach(purchase => {
      const date = safeDate(purchase.date);
      const dateKey = date ? date.toISOString().split('T')[0] : 'unknown-date';
      if (!groups[dateKey]) groups[dateKey] = { purchases: [], dailyTotal: 0 };
      groups[dateKey].purchases.push(purchase);
      groups[dateKey].dailyTotal += purchase.total || 0;
    });
    return groups;
  }, [filteredPurchases]);

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "Today's Sales";
    if (dateStr === yesterday) return "Yesterday's Sales";
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDatePurchases = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "Today's Purchases";
    if (dateStr === yesterday) return "Yesterday's Purchases";
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      Paid: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
      Partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
      Pending: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle className="w-3 h-3" /> }
    };
    const style = styles[status] || styles.Pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
        {style.icon}
        {status}
      </span>
    );
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCustomerFilter('all');
    setPaymentStatusFilter('all');
  };

  const hasActiveFilters = dateFrom || dateTo || customerFilter !== 'all' || paymentStatusFilter !== 'all';

  // Edit functions
  const updateEditItem = useCallback((productId: string, field: 'quantity' | 'price', value: number) => {
    if (!editingSale) return;
    const newItems = editingSale.items.map(item => {
      if (item.productId === productId) {
        const newQty = field === 'quantity' ? Math.max(1, value) : item.quantity;
        const newPrice = field === 'price' ? Math.max(0, value) : item.unitPrice;
        return { ...item, quantity: newQty, unitPrice: newPrice, totalPrice: newQty * newPrice };
      }
      return item;
    });
    const subtotal = newItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const total = subtotal - (editingSale.cartDiscount || 0);
    setEditingSale({
      ...editingSale,
      items: newItems,
      subtotal,
      total,
      due: Math.max(0, total - editingSale.paid)
    });
  }, [editingSale]);

  const removeEditItem = useCallback((productId: string) => {
    if (!editingSale) return;
    const newItems = editingSale.items.filter(item => item.productId !== productId);
    const subtotal = newItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const total = subtotal - (editingSale.cartDiscount || 0);
    setEditingSale({
      ...editingSale,
      items: newItems,
      subtotal,
      total,
      due: Math.max(0, total - editingSale.paid)
    });
  }, [editingSale]);

  const addProductToEdit = useCallback((productId: string) => {
    if (!editingSale) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const exists = editingSale.items.find(item => item.productId === productId);
    if (exists) {
      updateEditItem(productId, 'quantity', exists.quantity + 1);
      return;
    }
    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.salePrice,
      discount: 0,
      taxAmount: 0,
      totalPrice: product.salePrice,
      isReturned: false,
      returnedQty: 0
    };
    const newItems = [...editingSale.items, newItem];
    const subtotal = newItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const total = subtotal - (editingSale.cartDiscount || 0);
    setEditingSale({
      ...editingSale,
      items: newItems,
      subtotal,
      total,
      due: Math.max(0, total - editingSale.paid)
    });
  }, [editingSale, products, updateEditItem]);

  const updateEditDiscount = useCallback((discount: number) => {
    if (!editingSale) return;
    const total = editingSale.subtotal - discount;
    const newPaymentStatus = editingSale.paid >= total ? 'Paid' : editingSale.paid > 0 ? 'Partial' : 'Pending';
    setEditingSale({
      ...editingSale,
      cartDiscount: discount,
      total,
      due: Math.max(0, total - editingSale.paid),
      paymentStatus: newPaymentStatus
    });
  }, [editingSale]);

  const updateEditPaid = useCallback((paid: number) => {
    if (!editingSale) return;
    const newPaymentStatus = paid >= editingSale.total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
    setEditingSale({
      ...editingSale,
      paid,
      due: Math.max(0, editingSale.total - paid),
      paymentStatus: newPaymentStatus
    });
  }, [editingSale]);

  const saveEdit = useCallback(() => {
    if (!editingSale) return;
    const auditLog: Partial<AuditLog> = {
      entityType: 'Sale',
      entityId: editingSale.id,
      action: 'update',
      newData: JSON.stringify(editingSale),
      notes: `Sale Updated • Total: ${CURRENCY_SYMBOL}${editingSale.total.toFixed(2)} • Paid: ${CURRENCY_SYMBOL}${editingSale.paid.toFixed(2)} • Due: ${CURRENCY_SYMBOL}${editingSale.due.toFixed(2)} • Customer: ${editingSale.customerName || 'Walk-in'}`
    };
    onUpdateSale(editingSale.id, editingSale, auditLog);
    setEditingSale(null);
  }, [editingSale, onUpdateSale]);

  // Delete with stock restore
  const confirmDelete = useCallback((restoreStock: boolean) => {
    if (saleToDelete) {
      const auditLog: Partial<AuditLog> = {
        entityType: 'Sale',
        entityId: saleToDelete.id,
        action: 'delete',
        oldData: JSON.stringify(saleToDelete),
        notes: `Sale Deleted • Total: ${CURRENCY_SYMBOL}${saleToDelete.total.toFixed(2)} • Paid: ${CURRENCY_SYMBOL}${saleToDelete.paid.toFixed(2)} • Due: ${CURRENCY_SYMBOL}${saleToDelete.due.toFixed(2)} • Customer: ${saleToDelete.customerName || 'Walk-in'}${restoreStock ? ' (Stock Restored)' : ''}`
      };
      onDeleteSale(saleToDelete.id, restoreStock);
      setSaleToDelete(null);
    }
  }, [saleToDelete, onDeleteSale]);

  // Handle additional payment
  const handleAddPayment = useCallback(() => {
    if (!paymentSale || additionalPayment.amount <= 0) return;
    const newPayment: SalePayment = {
      id: crypto.randomUUID(),
      saleId: paymentSale.id,
      amount: additionalPayment.amount,
      paymentMethod: additionalPayment.method,
      notes: additionalPayment.notes,
      createdAt: new Date()
    };
    const newPaid = paymentSale.paid + additionalPayment.amount;
    const newDue = Math.max(0, paymentSale.total - newPaid);
    const newPaymentStatus = newDue <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';
    const updatedSale: Partial<Sale> = {
      paid: newPaid,
      due: newDue,
      paymentStatus: newPaymentStatus,
      payments: [...(paymentSale.payments || []), newPayment]
    };
    const auditLog: Partial<AuditLog> = {
      entityType: 'Sale',
      entityId: paymentSale.id,
      action: 'payment',
      newData: JSON.stringify({ additionalPayment: newPayment }),
      notes: `Payment Added • ${CURRENCY_SYMBOL}${additionalPayment.amount.toFixed(2)} via ${additionalPayment.method} • Total: ${CURRENCY_SYMBOL}${paymentSale.total.toFixed(2)} • Paid: ${CURRENCY_SYMBOL}${newPaid.toFixed(2)} • Due: ${CURRENCY_SYMBOL}${newDue.toFixed(2)}`
    };
    onUpdateSale(paymentSale.id, updatedSale, auditLog);
    if (onAddPayment) onAddPayment(paymentSale.id, newPayment);
    setPaymentSale(null);
    setAdditionalPayment({ amount: 0, method: 'Cash', notes: '' });
  }, [paymentSale, additionalPayment, onUpdateSale, onAddPayment, settings]);

  // Handle item return
  const handleReturnItems = useCallback(() => {
    if (!returningSale || !onReturnItems) return;
    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (itemsToReturn.length === 0) return;
    
    // Calculate refund amount
    const refundAmount = itemsToReturn.reduce((acc, item) => {
      const saleItem = returningSale.items.find(i => i.productId === item.productId);
      return acc + (saleItem ? saleItem.unitPrice * item.quantity : 0);
    }, 0);
    
    const auditLog: Partial<AuditLog> = {
      entityType: 'Sale',
      entityId: returningSale.id,
      action: 'return',
      newData: JSON.stringify({ returnedItems: itemsToReturn }),
      notes: `Items Returned • ${itemsToReturn.length} item(s) • Refund: ${CURRENCY_SYMBOL}${refundAmount.toFixed(2)} • Total: ${CURRENCY_SYMBOL}${returningSale.total.toFixed(2)} • Paid: ${CURRENCY_SYMBOL}${returningSale.paid.toFixed(2)} • Due: ${CURRENCY_SYMBOL}${returningSale.due.toFixed(2)}`
    };
    onReturnItems(returningSale.id, itemsToReturn);
    onUpdateSale(returningSale.id, {}, auditLog);
    setReturningSale(null);
    setReturnItems({});
  }, [returningSale, returnItems, onReturnItems, onUpdateSale]);

  // Print invoice - Professional Version
  const printInvoice = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const invoiceNumber = sale.invoiceNumber || sale.id.slice(0, 8).toUpperCase();
    const invoiceDate = new Date(sale.date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
            padding: 0;
            background: #f8fafc;
            color: #1e293b;
          }
          .page {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 40px;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 300px;
            height: 300px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -5%;
            width: 200px;
            height: 200px;
            background: rgba(255,255,255,0.03);
            border-radius: 50%;
          }
          .header-content {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand {
            flex: 1;
          }
          .shop-name {
            font-size: 36px;
            font-weight: 900;
            letter-spacing: -1px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .shop-tagline {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #60a5fa;
            margin-bottom: 16px;
          }
          .shop-details {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
          }
          .invoice-badge {
            background: white;
            color: #0f172a;
            padding: 20px 30px;
            border-radius: 16px;
            text-align: right;
            min-width: 200px;
          }
          .invoice-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
          }
          .invoice-number {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
          }
          .invoice-status {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-partial { background: #fef3c7; color: #92400e; }
          .status-pending { background: #fee2e2; color: #991b1b; }
          
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding: 40px;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-box {
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
          }
          .info-title {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 12px;
          }
          .info-name {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .info-detail {
            font-size: 13px;
            color: #64748b;
            line-height: 1.6;
          }
          .dates-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 16px;
          }
          .date-item {
            background: white;
            padding: 12px;
            border-radius: 8px;
          }
          .date-label {
            font-size: 10px;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .date-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
          }
          
          .items-section {
            padding: 40px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            background: #f1f5f9;
            padding: 14px 16px;
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            border-bottom: 3px solid #0f172a;
          }
          thead th:last-child { text-align: right; }
          thead th:nth-last-child(2) { text-align: right; }
          thead th:nth-last-child(3) { text-align: center; }
          tbody td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            vertical-align: top;
          }
          tbody tr:hover { background: #fafafa; }
          .item-name {
            font-weight: 600;
            color: #0f172a;
          }
          .item-sku {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .qty-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
          }
          .price { text-align: right; font-weight: 600; }
          .total-price { text-align: right; font-weight: 700; color: #0f172a; }
          
          .summary-section {
            padding: 0 40px 40px;
          }
          .summary-grid {
            display: flex;
            justify-content: flex-end;
          }
          .summary-box {
            width: 320px;
            background: #f8fafc;
            border-radius: 16px;
            overflow: hidden;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 14px 20px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
          }
          .summary-label {
            color: #64748b;
            font-weight: 600;
          }
          .summary-value {
            font-weight: 700;
            color: #0f172a;
          }
          .discount-value { color: #dc2626; }
          .paid-value { color: #16a34a; }
          .due-value { color: #ea580c; }
          .grand-row {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .grand-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
          }
          .grand-value {
            font-size: 28px;
            font-weight: 900;
          }
          
          .payment-info {
            padding: 0 40px 40px;
          }
          .payment-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px solid #22c55e;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .payment-icon {
            width: 48px;
            height: 48px;
            background: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
          }
          .payment-text {
            flex: 1;
          }
          .payment-title {
            font-weight: 700;
            color: #166534;
            margin-bottom: 4px;
          }
          .payment-detail {
            font-size: 13px;
            color: #166534;
            opacity: 0.8;
          }
          
          .footer {
            background: #f8fafc;
            padding: 32px 40px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          .footer-text {
            font-size: 12px;
            color: #64748b;
            line-height: 1.8;
          }
          .footer-brand {
            font-weight: 700;
            color: #0f172a;
          }
          .qr-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px dashed #e2e8f0;
            display: flex;
            justify-content: center;
            gap: 40px;
          }
          .qr-item {
            text-align: center;
          }
          .qr-label {
            font-size: 10px;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .qr-placeholder {
            width: 80px;
            height: 80px;
            background: white;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            font-size: 10px;
          }
          
          @media print {
            body { background: white; padding: 0; }
            .page { box-shadow: none; }
            @page { margin: 0; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="header-content">
              <div class="brand">
                <h1 class="shop-name">${settings?.shopName || 'Dokan'}</h1>
                <p class="shop-tagline">${settings?.shopBio || 'Premium Quality Products'}</p>
                <div class="shop-details">
                  ${settings?.shopAddress || '123 Business Street'}<br>
                  ${settings?.shopContact ? `Phone: ${settings.shopContact}` : ''}
                  ${settings?.shopEmail ? `<br>Email: ${settings.shopEmail}` : ''}
                </div>
              </div>
              <div class="invoice-badge">
                <p class="invoice-label">Invoice</p>
                <p class="invoice-number">#${invoiceNumber}</p>
                <span class="invoice-status status-${sale.paymentStatus?.toLowerCase() || 'pending'}">${sale.paymentStatus || 'Pending'}</span>
              </div>
            </div>
          </div>
          
          <!-- Client & Dates Info -->
          <div class="info-section">
            <div class="info-box">
              <p class="info-title">Bill To</p>
              <p class="info-name">${sale.customerName || 'Walk-in Customer'}</p>
              <p class="info-detail">
                ${sale.customerId && sale.customerId !== 'walk-in' ? 'Registered Customer' : 'Walk-in Customer'}
              </p>
            </div>
            <div class="info-box" style="border-left-color: #22c55e;">
              <p class="info-title">Payment Details</p>
              <p class="info-name">${sale.paymentMethod || 'Cash'}</p>
              <div class="dates-grid">
                <div class="date-item">
                  <p class="date-label">Invoice Date</p>
                  <p class="date-value">${invoiceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
                <div class="date-item">
                  <p class="date-label">Due Date</p>
                  <p class="date-value">${dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Items Table -->
          <div class="items-section">
            <p class="section-title">Items / Services</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Description</th>
                  <th style="width: 15%;">Qty</th>
                  <th style="width: 15%;">Rate</th>
                  <th style="width: 20%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(sale.items || []).map((item, idx) => {
                  // Support both old (name, price, total) and new (productName, unitPrice, totalPrice) field names
                  const name = item.productName || item.name || 'Unknown Product';
                  const price = item.unitPrice || item.price || 0;
                  const total = item.totalPrice || item.total || 0;
                  const sku = item.sku || '';
                  const qty = item.quantity || 0;
                  return `
                <tr>
                  <td>
                    <p class="item-name">${name}</p>
                    <p class="item-sku">${sku ? `SKU: ${sku}` : `Item #${idx + 1}`}</p>
                  </td>
                  <td style="text-align: center;"><span class="qty-badge">${qty}</span></td>
                  <td class="price">${settings?.currencySymbol || '$'}${price.toFixed(2)}</td>
                  <td class="total-price">${settings?.currencySymbol || '$'}${total.toFixed(2)}</td>
                </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Summary -->
          <div class="summary-section">
            <div class="summary-grid">
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Subtotal</span>
                  <span class="summary-value">${settings?.currencySymbol || '$'}${(sale.subtotal || 0).toFixed(2)}</span>
                </div>
                ${(sale.cartDiscount || 0) > 0 ? `
                <div class="summary-row">
                  <span class="summary-label">Discount</span>
                  <span class="summary-value discount-value">-${settings?.currencySymbol || '$'}${(sale.cartDiscount || 0).toFixed(2)}</span>
                </div>
                ` : ''}
                ${(sale.taxAmount || 0) > 0 ? `
                <div class="summary-row">
                  <span class="summary-label">Tax (${(sale.taxRate || 0)}%)</span>
                  <span class="summary-value">${settings?.currencySymbol || '$'}${(sale.taxAmount || 0).toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row">
                  <span class="summary-label">Paid Amount</span>
                  <span class="summary-value paid-value">${settings?.currencySymbol || '$'}${(sale.paid || 0).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Due Amount</span>
                  <span class="summary-value due-value">${settings?.currencySymbol || '$'}${(sale.due || 0).toFixed(2)}</span>
                </div>
                <div class="grand-row">
                  <div>
                    <p class="grand-label">Total Amount</p>
                    <p class="grand-value">${settings?.currencySymbol || '$'}${(sale.total || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Payment Status Info -->
          ${(sale.due || 0) > 0 ? `
          <div class="payment-info">
            <div class="payment-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: #f59e0b;">
              <div class="payment-icon" style="background: #f59e0b;">⚠</div>
              <div class="payment-text">
                <p class="payment-title" style="color: #92400e;">Payment Pending</p>
                <p class="payment-detail" style="color: #92400e;">Outstanding balance of ${settings?.currencySymbol || '$'}${(sale.due || 0).toFixed(2)} is due by ${dueDate.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          ` : `
          <div class="payment-info">
            <div class="payment-box">
              <div class="payment-icon">✓</div>
              <div class="payment-text">
                <p class="payment-title">Payment Complete</p>
                <p class="payment-detail">Thank you for your payment!</p>
              </div>
            </div>
          </div>
          `}
          
          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">
              ${settings?.receiptFooter || 'Thank you for your business! We appreciate your trust in us.'}
            </p>
            <p class="footer-text" style="margin-top: 12px;">
              <span class="footer-brand">${settings?.shopName || 'Dokan'}</span> • ${settings?.shopServices || 'Quality Products & Services'}
            </p>
            <div class="qr-section">
              <div class="qr-item">
                <p class="qr-label">Invoice QR</p>
                <div class="qr-placeholder">QR Code</div>
              </div>
              <div class="qr-item">
                <p class="qr-label">Payment QR</p>
                <div class="qr-placeholder">Scan to Pay</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Compact Print for Thermal Printers - Uses Custom Templates
  const printCompact = (sale: Sale) => {
    // Use the custom print template system
    printWithTemplate(sale, {
      settings,
      paperSize: 'thermal-80',
    });
  };

  // Print Purchase Invoice - Professional Version
  const printPurchaseInvoice = (purchase: Purchase) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const invoiceNumber = purchase.purchaseNumber || purchase.id.slice(0, 8).toUpperCase();
    const invoiceDate = new Date(purchase.date);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order #${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f8fafc; color: #1e293b; }
          .page { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); color: white; padding: 40px; position: relative; overflow: hidden; }
          .header-content { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand { flex: 1; }
          .shop-name { font-size: 36px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px; text-transform: uppercase; }
          .shop-tagline { font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #a7f3d0; margin-bottom: 16px; }
          .shop-details { font-size: 13px; color: #99f6e4; line-height: 1.6; }
          .invoice-badge { background: white; color: #0d9488; padding: 20px 30px; border-radius: 16px; text-align: right; min-width: 200px; }
          .invoice-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .invoice-number { font-size: 20px; font-weight: 900; color: #0d9488; }
          .invoice-status { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-due { background: #fef3c7; color: #92400e; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 40px; border-bottom: 1px solid #e2e8f0; }
          .info-box { background: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid #0d9488; }
          .info-title { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
          .info-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
          .info-detail { font-size: 13px; color: #64748b; line-height: 1.6; }
          .items-section { padding: 40px; }
          .section-title { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #64748b; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; }
          thead th { background: #f1f5f9; padding: 14px 16px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 3px solid #0d9488; }
          thead th:last-child { text-align: right; }
          thead th:nth-last-child(2) { text-align: right; }
          thead th:nth-last-child(3) { text-align: center; }
          tbody td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: top; }
          tbody tr:hover { background: #fafafa; }
          .item-name { font-weight: 600; color: #0f172a; }
          .item-sku { font-size: 11px; color: #94a3b8; margin-top: 4px; }
          .qty-badge { display: inline-block; background: #ccfbf1; color: #0d9488; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; }
          .price { text-align: right; font-weight: 600; }
          .total-price { text-align: right; font-weight: 700; color: #0f172a; }
          .summary-section { padding: 0 40px 40px; }
          .summary-grid { display: flex; justify-content: flex-end; }
          .summary-box { width: 320px; background: #f8fafc; border-radius: 16px; overflow: hidden; }
          .summary-row { display: flex; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .summary-label { color: #64748b; font-weight: 600; }
          .summary-value { font-weight: 700; color: #0f172a; }
          .paid-value { color: #16a34a; }
          .due-value { color: #ea580c; }
          .grand-row { background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
          .grand-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #99f6e4; }
          .grand-value { font-size: 28px; font-weight: 900; }
          .footer { background: #f8fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0; text-align: center; }
          .footer-text { font-size: 12px; color: #64748b; line-height: 1.8; }
          .footer-brand { font-weight: 700; color: #0f172a; }
          @media print { body { background: white; padding: 0; } .page { box-shadow: none; } @page { margin: 0; size: A4; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="header-content">
              <div class="brand">
                <h1 class="shop-name">${settings?.shopName || 'Dokan'}</h1>
                <p class="shop-tagline">PURCHASE ORDER</p>
                <div class="shop-details">
                  ${settings?.shopAddress || '123 Business Street'}<br>
                  ${settings?.shopContact ? `Phone: ${settings.shopContact}` : ''}
                </div>
              </div>
              <div class="invoice-badge">
                <p class="invoice-label">Purchase Order</p>
                <p class="invoice-number">#${invoiceNumber}</p>
                <span class="invoice-status ${purchase.balance > 0 ? 'status-due' : 'status-paid'}">${purchase.balance > 0 ? 'Due' : 'Paid'}</span>
              </div>
            </div>
          </div>
          <div class="info-section">
            <div class="info-box">
              <p class="info-title">Supplier</p>
              <p class="info-name">${purchase.supplierName || 'Unknown Supplier'}</p>
              <p class="info-detail">Purchase Order</p>
            </div>
            <div class="info-box" style="border-left-color: #10b981;">
              <p class="info-title">Order Details</p>
              <p class="info-name">${invoiceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <p class="info-detail">Status: ${purchase.status || 'Received'}</p>
            </div>
          </div>
          <div class="items-section">
            <p class="section-title">Items Purchased</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Description</th>
                  <th style="width: 15%;">Qty</th>
                  <th style="width: 15%;">Rate</th>
                  <th style="width: 20%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(purchase.items || []).map((item, idx) => `
                  <tr>
                    <td>
                      <p class="item-name">${item.productName || 'Unknown'}</p>
                      <p class="item-sku">${item.sku ? `SKU: ${item.sku}` : `Item #${idx + 1}`}</p>
                    </td>
                    <td style="text-align: center;"><span class="qty-badge">${item.quantity || 0}</span></td>
                    <td class="price">${formatCurrency(item.unitPrice || 0)}</td>
                    <td class="total-price">${formatCurrency(item.totalPrice || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="summary-section">
            <div class="summary-grid">
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Subtotal</span>
                  <span class="summary-value">${formatCurrency(purchase.subtotal || 0)}</span>
                </div>
                ${(purchase.discount || 0) > 0 ? `
                <div class="summary-row">
                  <span class="summary-label">Discount</span>
                  <span class="summary-value" style="color: #dc2626;">-${formatCurrency(purchase.discount || 0)}</span>
                </div>
                ` : ''}
                <div class="summary-row">
                  <span class="summary-label">Paid Amount</span>
                  <span class="summary-value paid-value">${formatCurrency(purchase.paid || 0)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Due Amount</span>
                  <span class="summary-value due-value">${formatCurrency(purchase.balance || 0)}</span>
                </div>
                <div class="grand-row">
                  <div>
                    <p class="grand-label">Total Amount</p>
                    <p class="grand-value">${formatCurrency(purchase.total || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p class="footer-text">${settings?.receiptFooter || 'Thank you for your business!'}</p>
            <p class="footer-text" style="margin-top: 12px;">
              <span class="footer-brand">${settings?.shopName || 'Dokan'}</span> • Purchase Order
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  // Compact Print for Purchase (Thermal) - Opens Print Dialog
  const printPurchaseCompact = (purchase: Purchase) => {
    setPrintPurchase(purchase);
    setPrintSale(null);
    setPrintDialogType('purchase');
    setShowPrintDialog(true);
  };

  // Handle purchase payment
  const handlePurchasePayment = useCallback(() => {
    if (!paymentPurchase || purchasePayment.amount <= 0 || !onUpdatePurchase) return;
    
    const newPaid = paymentPurchase.paid + purchasePayment.amount;
    const newBalance = Math.max(0, paymentPurchase.total - newPaid);
    const newPaymentStatus = newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';
    
    const newPayment = {
      id: crypto.randomUUID(),
      amount: purchasePayment.amount,
      paymentMethod: purchasePayment.method,
      notes: purchasePayment.notes,
      createdAt: new Date()
    };
    
    const auditLog: Partial<AuditLog> = {
      entityType: 'Purchase',
      entityId: paymentPurchase.id,
      action: 'payment',
      newData: JSON.stringify({ additionalPayment: newPayment }),
      notes: `Payment Added • ${formatCurrency(purchasePayment.amount)} via ${purchasePayment.method}`
    };
    
    onUpdatePurchase(paymentPurchase.id, {
      paid: newPaid,
      balance: newBalance,
      paymentStatus: newPaymentStatus,
      payments: [...(paymentPurchase.payments || []), newPayment]
    }, auditLog);
    
    setPaymentPurchase(null);
    setPurchasePayment({ amount: 0, method: 'Cash', notes: '' });
  }, [paymentPurchase, purchasePayment, onUpdatePurchase]);

  // Handle purchase delete
  const handlePurchaseDelete = useCallback(() => {
    if (!purchaseToDelete || !onDeletePurchase) return;
    onDeletePurchase(purchaseToDelete.id);
    setPurchaseToDelete(null);
  }, [purchaseToDelete, onDeletePurchase]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header with Tabs */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            <p className="text-slate-500 text-sm mt-1">View and manage all your sales and purchases</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
        
        {/* Tab Buttons */}
        <div className="mt-4 flex gap-2">
          {canViewSales && (
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'sales' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Sales History
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'sales' ? 'bg-white/20' : 'bg-slate-100'}`}>
                {sales.length}
              </span>
            </button>
          )}
          {canViewPurchases && (
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'purchases' 
                  ? 'bg-teal-600 text-white shadow-lg' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              Purchases History
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'purchases' ? 'bg-white/20' : 'bg-slate-100'}`}>
                {safePurchases.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Calendar className="w-3 h-3" />
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Calendar className="w-3 h-3" />
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Customer/Supplier Filter */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                {activeTab === 'sales' ? <Users className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                {activeTab === 'sales' ? 'Customer' : 'Supplier'}
              </label>
              <select
                value={activeTab === 'sales' ? customerFilter : supplierFilter}
                onChange={(e) => activeTab === 'sales' ? setCustomerFilter(e.target.value) : setSupplierFilter(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All {activeTab === 'sales' ? 'Customers' : 'Suppliers'}</option>
                {activeTab === 'sales' 
                  ? (Array.isArray(customers) ? customers : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  : safeSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                }
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                <DollarSign className="w-3 h-3" />
                Payment Status
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sales Summary Cards */}
      {activeTab === 'sales' && canViewSales && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{filteredSales.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(filteredSales.reduce((a, s) => a + s.total, 0))}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(filteredSales.reduce((a, s) => a + s.paid, 0))}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Due</p>
          <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(filteredSales.reduce((a, s) => a + s.due, 0))}</p>
        </div>
      </div>
      )}

      {/* Purchases Summary Cards */}
      {activeTab === 'purchases' && canViewPurchases && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Purchases</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{filteredPurchases.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</p>
          <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(filteredPurchases.reduce((a, p) => a + p.total, 0))}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(filteredPurchases.reduce((a, p) => a + p.paid, 0))}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Due</p>
          <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(filteredPurchases.reduce((a, p) => a + p.balance, 0))}</p>
        </div>
      </div>
      )}

      {/* Sales List */}
      {activeTab === 'sales' && canViewSales && (
      <div className="space-y-8">
        {Object.keys(groupedSales).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 sm:p-20 text-center border-2 border-dashed border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-blue-600 text-sm font-bold">
                Clear filters to see all sales
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedSales).map(([date, data]) => (
            <div key={date} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Date Header - Fixed */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                <h3 className="font-bold">{formatDate(date)}</h3>
                <div className="text-right">
                  <p className="text-xs text-slate-300">Daily Revenue</p>
                  <span className="text-lg font-black">{formatCurrency(data.dailyTotal)}</span>
                </div>
              </div>

              {/* Sales Table - Scrollable */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Due</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.sales.map(s => (
                      <tr key={s.id || `sale-${Date.now()}-${Math.random()}`} className="hover:bg-blue-50/50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{s.invoiceNumber || (s.id ? s.id.slice(0, 8).toUpperCase() : 'NEW')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {(() => { const d = safeDate(s.date); return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'; })()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 text-sm">{s.customerName || 'Walk-in Customer'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">
                            <Package className="w-3 h-3" />
                            {(s.items || []).length}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-sm">{formatCurrency(s.total || 0)}</td>
                        <td className="px-4 py-3 font-bold text-sm text-green-600">{formatCurrency(s.paid || 0)}</td>
                        <td className="px-4 py-3 font-bold text-sm text-red-600">{formatCurrency(s.due || 0)}</td>
                        <td className="px-4 py-3">{getPaymentStatusBadge(s.paymentStatus)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingSale(s)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { 
                                setPrintSale(s); 
                                setPrintPurchase(null);
                                setPrintDialogType('sale');
                                setShowPrintDialog(true); 
                              }}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                              title="Print Receipt (Thermal)"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            {canEditSales && (
                              <button
                                onClick={() => setEditingSale({ ...s })}
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {s.due > 0 && canEditSales && (
                              <button
                                onClick={() => setPaymentSale(s)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                title="Payment"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
                            {canReturnSales && (
                              <button
                                onClick={() => { setReturningSale(s); setReturnItems({}); }}
                                className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-all"
                                title="Return"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setAuditSale(s)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all"
                              title="Audit"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            {canDeleteSales && (
                              <button
                                onClick={() => setSaleToDelete(s)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
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
          ))
        )}
      </div>
      )}

      {/* Purchases List - Same Style as Sales */}
      {activeTab === 'purchases' && canViewPurchases && (
      <div className="space-y-8">
        {Object.keys(groupedPurchases).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 sm:p-20 text-center border-2 border-dashed border-slate-200">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No purchase records found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-blue-600 text-sm font-bold">
                Clear filters to see all purchases
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedPurchases).map(([date, data]) => (
            <div key={date} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Date Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-teal-600 text-white">
                <h3 className="font-bold">{formatDatePurchases(date)}</h3>
                <div className="text-right">
                  <p className="text-xs text-teal-100">Daily Total</p>
                  <span className="text-lg font-black">{formatCurrency(data.dailyTotal)}</span>
                </div>
              </div>

              {/* Purchases Table - Scrollable */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Purchase #</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Due</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.purchases.map(p => (
                      <tr key={p.id || `purchase-${Date.now()}-${Math.random()}`} className="hover:bg-teal-50/50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{p.purchaseNumber || (p.id ? p.id.slice(0, 8).toUpperCase() : 'NEW')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {(() => { const d = safeDate(p.date); return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'; })()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 text-sm">{p.supplierName || 'Unknown Supplier'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">
                            <Package className="w-3 h-3" />
                            {(() => {
                              const items = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []);
                              return items.length;
                            })()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-sm">{formatCurrency(p.total || 0)}</td>
                        <td className="px-4 py-3 font-bold text-sm text-green-600">{formatCurrency(p.paid || 0)}</td>
                        <td className="px-4 py-3 font-bold text-sm text-red-600">{formatCurrency(p.balance || 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                            (p.balance || 0) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {(p.balance || 0) > 0 ? (
                              <>
                                <Clock className="w-3 h-3" />
                                Due
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingPurchase(p)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printPurchaseCompact(p)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                              title="Print Receipt (Thermal)"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            {canEditPurchases && (
                              <button
                                onClick={() => setEditingPurchase({ ...p })}
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {(p.balance || 0) > 0 && canEditPurchases && (
                              <button
                                onClick={() => setPaymentPurchase(p)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                title="Payment"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setAuditPurchase(p)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all"
                              title="Audit"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            {canDeletePurchases && (
                              <button
                                onClick={() => setPurchaseToDelete(p)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
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
          ))
        )}
      </div>
      )}

      {/* View Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8">
            <button
              onClick={() => setViewingSale(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 z-50 p-2 bg-slate-50 hover:bg-slate-100 rounded-full font-bold transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 p-6 sm:p-10 bg-white text-slate-900 overflow-y-auto max-h-[70vh]" id="printable-area">
              {/* Invoice Header */}
              <div className="border-b-4 border-slate-900 pb-6 mb-8">
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-slate-900">
                  {settings?.shopName || 'Dokan'}
                </h1>
                {settings?.shopBio && (
                  <p className="text-sm font-bold uppercase text-blue-600 tracking-widest mt-2">{settings.shopBio}</p>
                )}
                <p className="text-xs text-slate-500 mt-4">
                  {settings?.shopAddress || ''} | {settings?.shopPhone || settings?.shopContact || ''}
                </p>
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-900 p-6 rounded-[24px] text-white shadow-xl">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Client:</p>
                  <p className="text-lg font-bold uppercase">{viewingSale.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Invoice ID:</p>
                  <p className="text-base font-bold font-mono">#{viewingSale.invoiceNumber || viewingSale.id.toUpperCase()}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(viewingSale.date).toLocaleDateString()} at{' '}
                    {new Date(viewingSale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b-4 border-slate-900">
                    <th className="py-4 px-3 text-left text-xs font-bold uppercase tracking-widest">Item</th>
                    <th className="py-4 px-3 text-center text-xs font-bold uppercase tracking-widest">Qty</th>
                    <th className="py-4 px-3 text-right text-xs font-bold uppercase tracking-widest">Unit Price</th>
                    <th className="py-4 px-3 text-right text-xs font-bold uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b-4 border-slate-900">
                  {viewingSale.items.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                    <tr key={idx}>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          {(product?.imageUrl || product?.image) ? (
                            <img 
                              src={product?.imageUrl || product?.image} 
                              alt={item.productName}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm uppercase text-slate-800">{item.productName}</p>
                            <p className="text-xs text-slate-400">{item.sku && `SKU: ${item.sku}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm font-bold text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-lg font-bold">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-sm font-bold text-right">{formatCurrency(item.unitPrice || 0)}</td>
                      <td className="py-4 px-3 text-sm font-bold text-right text-slate-900">{formatCurrency(item.totalPrice || 0)}</td>
                    </tr>
                  );})}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-3">
                  <div className="flex justify-between items-center py-2 px-4 border-b">
                    <span className="text-xs font-bold uppercase text-slate-400">Subtotal</span>
                    <span className="text-sm font-bold">{formatCurrency(viewingSale.subtotal || 0)}</span>
                  </div>
                  {viewingSale.cartDiscount > 0 && (
                    <div className="flex justify-between items-center py-2 px-4 border-b">
                      <span className="text-xs font-bold uppercase text-slate-400">Discount</span>
                      <span className="text-sm font-bold text-red-500">-{formatCurrency(viewingSale.cartDiscount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 px-4 border-b">
                    <span className="text-xs font-bold uppercase text-slate-400">Paid</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(viewingSale.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-4 border-b">
                    <span className="text-xs font-bold uppercase text-slate-400">Due</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(viewingSale.due || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl shadow-xl">
                    <span className="text-xs font-bold uppercase tracking-widest">Net Amount</span>
                    <span className="text-2xl font-black">{formatCurrency(viewingSale.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 border-t flex flex-wrap gap-3">
              <button
                onClick={() => { setEditingSale({ ...viewingSale }); setViewingSale(null); }}
                className="flex-1 min-w-[140px] py-4 bg-green-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 active:scale-95 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Sale
              </button>
              <button
                onClick={() => {
                  setPrintSale(viewingSale);
                  setPrintDialogType('sale');
                  setShowPrintDialog(true);
                  setViewingSale(null);
                }}
                className="flex-1 min-w-[140px] py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Receipt className="w-4 h-4" />
                Print Receipt
              </button>
              {viewingSale.due > 0 && (
                <button
                  onClick={() => { setPaymentSale(viewingSale); setViewingSale(null); }}
                  className="flex-1 min-w-[140px] py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Add Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-5xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Edit Sale #{editingSale.invoiceNumber || editingSale.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-slate-500">Customer: {editingSale.customerName}</p>
              </div>
              <button
                onClick={() => setEditingSale(null)}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Items */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items
                </h3>
                <div className="space-y-3">
                  {editingSale.items.map((item) => (
                    <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-xl gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Price Input */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                          <span className="text-xs text-slate-400 px-1">$</span>
                          <input
                            type="number"
                            value={item.unitPrice || 0}
                            onChange={(e) => updateEditItem(item.productId, 'price', parseFloat(e.target.value) || 0)}
                            className="w-16 text-center font-bold bg-transparent outline-none text-sm"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        {/* Quantity Control */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                          <button
                            onClick={() => updateEditItem(item.productId, 'quantity', item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-md hover:bg-slate-200 transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateEditItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-10 text-center font-bold bg-transparent outline-none text-sm"
                          />
                          <button
                            onClick={() => updateEditItem(item.productId, 'quantity', item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="w-16 text-right font-bold text-sm">{formatCurrency(item.totalPrice || 0)}</p>
                        <button
                          onClick={() => removeEditItem(item.productId)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Product */}
                <div className="mt-4">
                  <select
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    onChange={(e) => { if (e.target.value) { addProductToEdit(e.target.value); e.target.value = ''; } }}
                    value=""
                  >
                    <option value="">+ Add Product</option>
                    {products
                      .filter(p => !editingSale.items.find(i => i.productId === p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${(p.salePrice || 0).toFixed(2)}) - Stock: {p.stock}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Discount & Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Discount ($)</label>
                  <input
                    type="number"
                    value={editingSale.cartDiscount || 0}
                    onChange={(e) => updateEditDiscount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Paid Amount ($)</label>
                  <input
                    type="number"
                    value={editingSale.paid || 0}
                    onChange={(e) => updateEditPaid(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Subtotal</p>
                    <p className="text-xl font-black">${(editingSale.subtotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Discount</p>
                    <p className="text-xl font-black text-red-400">-${(editingSale.cartDiscount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-xl font-black">${(editingSale.total || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Due</p>
                    <p className="text-xl font-black text-red-400">${(editingSale.due || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t flex gap-3 sticky bottom-0">
              <button
                onClick={() => setEditingSale(null)}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Delete Sale?</h3>
            <p className="text-slate-500 text-center mt-4 font-medium text-sm">
              Invoice #{saleToDelete.invoiceNumber || saleToDelete.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-slate-400 text-center mt-2 text-xs">
              Total: ${saleToDelete.total.toFixed(2)} | Items: {saleToDelete.items.length}
            </p>
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 font-medium text-center">
                Would you like to restore the items back to inventory?
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <button
                onClick={() => setSaleToDelete(null)}
                className="py-3 bg-slate-100 text-slate-500 font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(false)}
                className="py-3 bg-red-100 text-red-600 font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-red-200 transition-all"
              >
                Delete Only
              </button>
              <button
                onClick={() => confirmDelete(true)}
                className="py-3 bg-red-600 text-white font-bold rounded-xl uppercase text-xs tracking-widest shadow-lg hover:bg-red-700 active:scale-95 transition-all"
              >
                Delete & Restore
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
                onClick={() => { setReturningSale(null); setReturnItems({}); }}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <p className="text-sm text-slate-500 mb-4">Select items and quantities to return. Stock will be restored.</p>
              <div className="space-y-3">
                {returningSale.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-sm text-slate-500">Purchased: {item.quantity} | ${item.unitPrice.toFixed(2)} each</p>
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
                    Estimated refund: ${Object.entries(returnItems)
                      .reduce((total, [productId, qty]) => {
                        const item = returningSale.items.find(i => i.productId === productId);
                        return total + (item ? qty * item.unitPrice : 0);
                      }, 0)
                      .toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t flex gap-3 sticky bottom-0">
              <button
                onClick={() => { setReturningSale(null); setReturnItems({}); }}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnItems}
                disabled={!Object.values(returnItems).some(qty => qty > 0)}
                className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {paymentSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Payment</h2>
                  <p className="text-sm text-slate-500">Invoice #{paymentSale.invoiceNumber || paymentSale.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => { setPaymentSale(null); setAdditionalPayment({ amount: 0, method: 'Cash', notes: '' }); }}
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
                  <p className="text-lg font-black">${paymentSale.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Paid</p>
                  <p className="text-lg font-black text-green-400">${paymentSale.paid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Due</p>
                  <p className="text-lg font-black text-red-400">${paymentSale.due.toFixed(2)}</p>
                </div>
              </div>

              {/* Quick Pay Full */}
              <button
                onClick={() => setAdditionalPayment(prev => ({ ...prev, amount: paymentSale.due }))}
                className="w-full p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 hover:bg-green-100 transition-all"
              >
                Pay Full Amount (${paymentSale.due.toFixed(2)})
              </button>

              {/* Payment Amount */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Payment Amount ($)</label>
                <input
                  type="number"
                  value={additionalPayment.amount || ''}
                  onChange={(e) => setAdditionalPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  max={paymentSale.due}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold focus:border-blue-500 outline-none"
                  placeholder="Enter amount"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Payment Method</label>
                <select
                  value={additionalPayment.method}
                  onChange={(e) => setAdditionalPayment(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile Payment</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={additionalPayment.notes}
                  onChange={(e) => setAdditionalPayment(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => { setPaymentSale(null); setAdditionalPayment({ amount: 0, method: 'Cash', notes: '' }); }}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={additionalPayment.amount <= 0 || additionalPayment.amount > paymentSale.due}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {auditSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-purple-50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-600" />
                    Audit Trail
                  </h2>
                  <p className="text-sm text-slate-500">Invoice #{auditSale.invoiceNumber || auditSale.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setAuditSale(null)}
                  className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Sale Info */}
              <div className="bg-slate-900 text-white p-4 rounded-xl mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Created</p>
                    <p className="text-sm font-bold">{new Date(auditSale.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-sm font-bold">${auditSale.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Paid</p>
                    <p className="text-sm font-bold text-green-400">${auditSale.paid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Due</p>
                    <p className="text-sm font-bold text-orange-400">${auditSale.due.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                    <p className="text-sm font-bold">{auditSale.paymentStatus}</p>
                  </div>
                </div>
              </div>

              {/* Audit Log Entries */}
              <div className="space-y-4">
                {isLoadingAudit ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : auditLogs.length > 0 ? (
                  <>
                    {auditLogs.map((log, idx) => {
                      const getActionIcon = () => {
                        switch (log.action) {
                          case 'create': return <Plus className="w-5 h-5 text-green-600" />;
                          case 'update': return <Edit className="w-5 h-5 text-yellow-600" />;
                          case 'delete': return <Trash2 className="w-5 h-5 text-red-600" />;
                          case 'payment': return <CreditCard className="w-5 h-5 text-blue-600" />;
                          case 'return': return <RotateCcw className="w-5 h-5 text-orange-600" />;
                          default: return <History className="w-5 h-5 text-slate-600" />;
                        }
                      };
                      const getActionBg = () => {
                        switch (log.action) {
                          case 'create': return 'bg-green-100';
                          case 'update': return 'bg-yellow-100';
                          case 'delete': return 'bg-red-100';
                          case 'payment': return 'bg-blue-100';
                          case 'return': return 'bg-orange-100';
                          default: return 'bg-slate-100';
                        }
                      };
                      const getActionText = () => {
                        switch (log.action) {
                          case 'create': return 'Sale Created';
                          case 'update': return 'Sale Updated';
                          case 'delete': return 'Sale Deleted';
                          case 'payment': return 'Payment Added';
                          case 'return': return 'Items Returned';
                          default: return 'Action';
                        }
                      };
                      
                      return (
                        <div key={log.id || idx} className="flex gap-4">
                          <div className={`w-10 h-10 ${getActionBg()} rounded-full flex items-center justify-center shrink-0`}>
                            {getActionIcon()}
                          </div>
                          <div className="flex-1 pb-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900">{getActionText()}</p>
                              {log.userName && (
                                <span className="text-xs text-slate-400">by {log.userName}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                            {log.notes && (
                              <p className="text-sm text-slate-600 mt-1">{log.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Fallback to sale data if no audit logs */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <Plus className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 pb-4 border-b border-slate-100">
                        <p className="font-bold text-slate-900">Sale Created</p>
                        <p className="text-sm text-slate-500">
                          {new Date(auditSale.createdAt).toLocaleString()} - Initial creation of the sale
                        </p>
                      </div>
                    </div>

                    {/* Payment History from sale */}
                    {auditSale.payments && auditSale.payments.length > 0 && auditSale.payments.map((payment, idx) => (
                      <div key={payment.id || idx} className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 pb-4 border-b border-slate-100">
                          <p className="font-bold text-slate-900">Payment Received</p>
                          <p className="text-sm text-slate-500">
                            {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'} -
                            ${(payment.amount || 0).toFixed(2)} via {payment.paymentMethod}
                            {payment.notes && ` - ${payment.notes}`}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Update Entry */}
                    {auditSale.updatedAt && auditSale.updatedAt !== auditSale.createdAt && (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                          <Edit className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">Last Modified</p>
                          <p className="text-sm text-slate-500">
                            {new Date(auditSale.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t sticky bottom-0">
              <button
                onClick={() => setAuditSale(null)}
                className="w-full py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PURCHASE MODALS ==================== */}

      {/* View Purchase Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8">
            <button
              onClick={() => setViewingPurchase(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 z-50 p-2 bg-slate-50 hover:bg-slate-100 rounded-full font-bold transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 p-6 sm:p-10 bg-white text-slate-900 overflow-y-auto max-h-[70vh]">
              {/* Header */}
              <div className="border-b-4 border-teal-600 pb-6 mb-8">
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-slate-900">
                  {settings?.shopName || 'Dokan'}
                </h1>
                <p className="text-sm font-bold uppercase text-teal-600 tracking-widest mt-2">PURCHASE ORDER</p>
                <p className="text-xs text-slate-500 mt-4">
                  {settings?.shopAddress || ''} | {settings?.shopPhone || settings?.shopContact || ''}
                </p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-6 mb-8 bg-teal-600 p-6 rounded-[24px] text-white shadow-xl">
                <div>
                  <p className="text-xs font-bold uppercase text-teal-200 tracking-widest mb-1">Supplier:</p>
                  <p className="text-lg font-bold uppercase">{viewingPurchase.supplierName || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-teal-200 tracking-widest mb-1">PO Number:</p>
                  <p className="text-base font-bold font-mono">#{viewingPurchase.purchaseNumber || viewingPurchase.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-teal-200 mt-2">
                    {new Date(viewingPurchase.date).toLocaleDateString()} at{' '}
                    {new Date(viewingPurchase.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b-4 border-teal-600">
                    <th className="py-4 px-3 text-left text-xs font-bold uppercase tracking-widest">Item</th>
                    <th className="py-4 px-3 text-center text-xs font-bold uppercase tracking-widest">Qty</th>
                    <th className="py-4 px-3 text-right text-xs font-bold uppercase tracking-widest">Unit Price</th>
                    <th className="py-4 px-3 text-right text-xs font-bold uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b-4 border-teal-600">
                  {(viewingPurchase.items || []).map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                    <tr key={idx}>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          {(product?.imageUrl || product?.image) ? (
                            <img 
                              src={product?.imageUrl || product?.image} 
                              alt={item.productName || 'Unknown'}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center border border-slate-200">
                              <Package className="w-5 h-5 text-teal-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm uppercase text-slate-800">{item.productName || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{item.sku && `SKU: ${item.sku}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm font-bold text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-700 rounded-lg font-bold">
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-sm font-bold text-right">{formatCurrency(item.unitPrice || 0)}</td>
                      <td className="py-4 px-3 text-sm font-bold text-right text-slate-900">{formatCurrency(item.totalPrice || 0)}</td>
                    </tr>
                  );})}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-3">
                  <div className="flex justify-between items-center py-2 px-4 border-b">
                    <span className="text-xs font-bold uppercase text-slate-400">Subtotal</span>
                    <span className="text-sm font-bold">{formatCurrency(viewingPurchase.subtotal || 0)}</span>
                  </div>
                  {(viewingPurchase.discount || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 px-4 border-b">
                      <span className="text-xs font-bold uppercase text-slate-400">Discount</span>
                      <span className="text-sm font-bold text-red-500">-{formatCurrency(viewingPurchase.discount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 px-4 border-b">
                    <span className="text-xs font-bold uppercase text-slate-400">Paid</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(viewingPurchase.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-4 border-b">
                    <span className="text-xs font-bold uppercase text-slate-400">Due</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(viewingPurchase.balance || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-teal-600 text-white p-5 rounded-2xl shadow-xl">
                    <span className="text-xs font-bold uppercase tracking-widest">Net Amount</span>
                    <span className="text-2xl font-black">{formatCurrency(viewingPurchase.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 border-t flex flex-wrap gap-3">
              <button
                onClick={() => { setEditingPurchase({ ...viewingPurchase }); setViewingPurchase(null); }}
                className="flex-1 min-w-[140px] py-4 bg-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Purchase
              </button>
              <button
                onClick={() => {
                  setPrintPurchase(viewingPurchase);
                  setPrintDialogType('purchase');
                  setShowPrintDialog(true);
                  setViewingPurchase(null);
                }}
                className="flex-1 min-w-[140px] py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Receipt className="w-4 h-4" />
                Print Receipt
              </button>
              {viewingPurchase.balance > 0 && (
                <button
                  onClick={() => { setPaymentPurchase(viewingPurchase); setViewingPurchase(null); }}
                  className="flex-1 min-w-[140px] py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Add Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-3xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-teal-50 sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold">Edit Purchase #{editingPurchase.purchaseNumber || editingPurchase.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-slate-500">Supplier: {editingPurchase.supplierName}</p>
              </div>
              <button
                onClick={() => setEditingPurchase(null)}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Items Display */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items ({(editingPurchase.items || []).length})
                </h3>
                <div className="space-y-2">
                  {(editingPurchase.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{item.productName || 'Unknown'}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Price Input */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                          <span className="text-xs text-slate-400 px-1">$</span>
                          <input
                            type="number"
                            value={item.unitPrice || 0}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              const newItems = [...(editingPurchase.items || [])];
                              newItems[idx] = { ...newItems[idx], unitPrice: newPrice, totalPrice: (item.quantity || 0) * newPrice };
                              const newSubtotal = newItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
                              const newTotal = newSubtotal - (editingPurchase.discount || 0);
                              setEditingPurchase({
                                ...editingPurchase,
                                items: newItems,
                                subtotal: newSubtotal,
                                total: newTotal,
                                balance: Math.max(0, newTotal - editingPurchase.paid)
                              });
                            }}
                            className="w-16 text-center font-bold bg-transparent outline-none text-sm"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        {/* Quantity Control */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                          <button
                            onClick={() => {
                              const newQty = Math.max(1, (item.quantity || 1) - 1);
                              const newItems = [...(editingPurchase.items || [])];
                              newItems[idx] = { ...newItems[idx], quantity: newQty, totalPrice: newQty * (item.unitPrice || 0) };
                              const newSubtotal = newItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
                              const newTotal = newSubtotal - (editingPurchase.discount || 0);
                              setEditingPurchase({
                                ...editingPurchase,
                                items: newItems,
                                subtotal: newSubtotal,
                                total: newTotal,
                                balance: Math.max(0, newTotal - editingPurchase.paid)
                              });
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-md hover:bg-slate-200 transition-all"
                          >−</button>
                          <input
                            type="number"
                            value={item.quantity || 0}
                            onChange={(e) => {
                              const newQty = Math.max(1, parseInt(e.target.value) || 1);
                              const newItems = [...(editingPurchase.items || [])];
                              newItems[idx] = { ...newItems[idx], quantity: newQty, totalPrice: newQty * (item.unitPrice || 0) };
                              const newSubtotal = newItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
                              const newTotal = newSubtotal - (editingPurchase.discount || 0);
                              setEditingPurchase({
                                ...editingPurchase,
                                items: newItems,
                                subtotal: newSubtotal,
                                total: newTotal,
                                balance: Math.max(0, newTotal - editingPurchase.paid)
                              });
                            }}
                            className="w-10 text-center font-bold bg-transparent outline-none text-sm"
                          />
                          <button
                            onClick={() => {
                              const newQty = (item.quantity || 0) + 1;
                              const newItems = [...(editingPurchase.items || [])];
                              newItems[idx] = { ...newItems[idx], quantity: newQty, totalPrice: newQty * (item.unitPrice || 0) };
                              const newSubtotal = newItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
                              const newTotal = newSubtotal - (editingPurchase.discount || 0);
                              setEditingPurchase({
                                ...editingPurchase,
                                items: newItems,
                                subtotal: newSubtotal,
                                total: newTotal,
                                balance: Math.max(0, newTotal - editingPurchase.paid)
                              });
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-all"
                          >+</button>
                        </div>
                        <p className="w-16 text-right font-bold text-sm">{formatCurrency(item.totalPrice || 0)}</p>
                        <button
                          onClick={() => {
                            const newItems = (editingPurchase.items || []).filter((_, i) => i !== idx);
                            const newSubtotal = newItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
                            const newTotal = newSubtotal - (editingPurchase.discount || 0);
                            setEditingPurchase({
                              ...editingPurchase,
                              items: newItems,
                              subtotal: newSubtotal,
                              total: newTotal,
                              balance: Math.max(0, newTotal - editingPurchase.paid)
                            });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Product Dropdown */}
                <div className="mt-4">
                  <select
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const product = products.find(p => p.id === e.target.value);
                      if (!product) return;
                      
                      const existingItem = (editingPurchase.items || []).find(i => i.productId === product.id);
                      let newItems: typeof editingPurchase.items;
                      
                      if (existingItem) {
                        newItems = (editingPurchase.items || []).map(i => 
                          i.productId === product.id 
                            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * (i.unitPrice || 0) }
                            : i
                        );
                      } else {
                        newItems = [...(editingPurchase.items || []), {
                          productId: product.id,
                          productName: product.name,
                          sku: product.sku,
                          quantity: 1,
                          unitPrice: product.purchasePrice,
                          discount: 0,
                          totalPrice: product.purchasePrice,
                          batchNumber: product.batchNumber,
                          expiryDate: product.expiryDate
                        }];
                      }
                      
                      const newSubtotal = newItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
                      const newTotal = newSubtotal - (editingPurchase.discount || 0);
                      setEditingPurchase({
                        ...editingPurchase,
                        items: newItems,
                        subtotal: newSubtotal,
                        total: newTotal,
                        balance: Math.max(0, newTotal - editingPurchase.paid)
                      });
                      e.target.value = '';
                    }}
                    value=""
                  >
                    <option value="">+ Add Product</option>
                    {products
                      .filter(p => !(editingPurchase.items || []).find(i => i.productId === p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.purchasePrice)} (Stock: {p.stock})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Edit Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Discount ($)</label>
                  <input
                    type="number"
                    value={editingPurchase.discount || 0}
                    onChange={(e) => {
                      const newDiscount = Number(e.target.value);
                      const newTotal = (editingPurchase.subtotal || 0) - newDiscount;
                      setEditingPurchase({
                        ...editingPurchase,
                        discount: newDiscount,
                        total: newTotal,
                        balance: Math.max(0, newTotal - editingPurchase.paid)
                      });
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Paid Amount ($)</label>
                  <input
                    type="number"
                    value={editingPurchase.paid || 0}
                    onChange={(e) => {
                      const newPaid = Number(e.target.value);
                      setEditingPurchase({
                        ...editingPurchase,
                        paid: newPaid,
                        balance: Math.max(0, editingPurchase.total - newPaid)
                      });
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-teal-600 text-white p-6 rounded-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Subtotal</p>
                    <p className="text-xl font-black">{formatCurrency(editingPurchase.subtotal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Discount</p>
                    <p className="text-xl font-black text-red-300">-{formatCurrency(editingPurchase.discount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Total</p>
                    <p className="text-xl font-black">{formatCurrency(editingPurchase.total || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Due</p>
                    <p className="text-xl font-black text-red-300">{formatCurrency(editingPurchase.balance || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t flex gap-3 sticky bottom-0">
              <button
                onClick={() => setEditingPurchase(null)}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onUpdatePurchase) {
                    const auditLog: Partial<AuditLog> = {
                      entityType: 'Purchase',
                      entityId: editingPurchase.id,
                      action: 'update',
                      notes: `Purchase Updated • Items: ${(editingPurchase.items || []).length} • Total: ${formatCurrency(editingPurchase.total)}`
                    };
                    onUpdatePurchase(editingPurchase.id, {
                      items: editingPurchase.items,
                      subtotal: editingPurchase.subtotal,
                      discount: editingPurchase.discount,
                      paid: editingPurchase.paid,
                      balance: editingPurchase.balance,
                      total: editingPurchase.total,
                      paymentStatus: editingPurchase.balance <= 0 ? 'Paid' : editingPurchase.paid > 0 ? 'Partial' : 'Pending'
                    }, auditLog);
                  }
                  setEditingPurchase(null);
                }}
                className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Purchase Confirmation Modal */}
      {purchaseToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Delete Purchase?</h3>
            <p className="text-slate-500 text-center mt-4 font-medium text-sm">
              PO #{purchaseToDelete.purchaseNumber || purchaseToDelete.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-slate-400 text-center mt-2 text-xs">
              Total: {formatCurrency(purchaseToDelete.total)} | Items: {(purchaseToDelete.items || []).length}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setPurchaseToDelete(null)}
                className="py-3 bg-slate-100 text-slate-500 font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseDelete}
                className="py-3 bg-red-600 text-white font-bold rounded-xl uppercase text-xs tracking-widest shadow-lg hover:bg-red-700 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment to Purchase Modal */}
      {paymentPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-teal-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Payment</h2>
                  <p className="text-sm text-slate-500">PO #{paymentPurchase.purchaseNumber || paymentPurchase.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => { setPaymentPurchase(null); setPurchasePayment({ amount: 0, method: 'Cash', notes: '' }); }}
                  className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status */}
              <div className="grid grid-cols-3 gap-4 text-center bg-teal-600 text-white p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-teal-200 uppercase">Total</p>
                  <p className="text-lg font-black">{formatCurrency(paymentPurchase.total)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-200 uppercase">Paid</p>
                  <p className="text-lg font-black text-green-300">{formatCurrency(paymentPurchase.paid)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-200 uppercase">Due</p>
                  <p className="text-lg font-black text-red-300">{formatCurrency(paymentPurchase.balance)}</p>
                </div>
              </div>

              {/* Quick Pay Full */}
              <button
                onClick={() => setPurchasePayment(prev => ({ ...prev, amount: paymentPurchase.balance }))}
                className="w-full p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 hover:bg-green-100 transition-all"
              >
                Pay Full Amount ({formatCurrency(paymentPurchase.balance)})
              </button>

              {/* Payment Amount */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Payment Amount</label>
                <input
                  type="number"
                  value={purchasePayment.amount || ''}
                  onChange={(e) => setPurchasePayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  max={paymentPurchase.balance}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold focus:border-teal-500 outline-none"
                  placeholder="Enter amount"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Payment Method</label>
                <select
                  value={purchasePayment.method}
                  onChange={(e) => setPurchasePayment(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile Payment</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={purchasePayment.notes}
                  onChange={(e) => setPurchasePayment(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => { setPaymentPurchase(null); setPurchasePayment({ amount: 0, method: 'Cash', notes: '' }); }}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchasePayment}
                disabled={purchasePayment.amount <= 0 || purchasePayment.amount > paymentPurchase.balance}
                className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg hover:bg-teal-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Audit Trail Modal */}
      {auditPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-8">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-purple-50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-600" />
                    Audit Trail
                  </h2>
                  <p className="text-sm text-slate-500">PO #{auditPurchase.purchaseNumber || auditPurchase.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setAuditPurchase(null)}
                  className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Purchase Info */}
              <div className="bg-teal-600 text-white p-4 rounded-xl mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Created</p>
                    <p className="text-sm font-bold">{new Date(auditPurchase.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Total</p>
                    <p className="text-sm font-bold">{formatCurrency(auditPurchase.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Paid</p>
                    <p className="text-sm font-bold text-green-300">{formatCurrency(auditPurchase.paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-200 uppercase">Due</p>
                    <p className="text-sm font-bold text-red-300">{formatCurrency(auditPurchase.balance)}</p>
                  </div>
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="space-y-4">
                {isLoadingPurchaseAudit ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 text-sm mt-2">Loading audit trail...</p>
                  </div>
                ) : purchaseAuditLogs.length > 0 ? (
                  purchaseAuditLogs.map((log, idx) => {
                    const getActionIcon = () => {
                      switch (log.action) {
                        case 'create': return <Plus className="w-5 h-5 text-green-600" />;
                        case 'update': return <Edit className="w-5 h-5 text-yellow-600" />;
                        case 'delete': return <Trash2 className="w-5 h-5 text-red-600" />;
                        case 'payment': return <CreditCard className="w-5 h-5 text-blue-600" />;
                        default: return <History className="w-5 h-5 text-slate-600" />;
                      }
                    };
                    const getActionBg = () => {
                      switch (log.action) {
                        case 'create': return 'bg-green-100';
                        case 'update': return 'bg-yellow-100';
                        case 'delete': return 'bg-red-100';
                        case 'payment': return 'bg-blue-100';
                        default: return 'bg-slate-100';
                      }
                    };
                    
                    return (
                      <div key={log.id || idx} className="flex gap-4">
                        <div className={`w-10 h-10 ${getActionBg()} rounded-full flex items-center justify-center shrink-0`}>
                          {getActionIcon()}
                        </div>
                        <div className="flex-1 pb-4 border-b border-slate-100">
                          <p className="font-bold text-slate-900 capitalize">{log.action}</p>
                          <p className="text-sm text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                          {log.notes && <p className="text-sm text-slate-600 mt-1">{log.notes}</p>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 pb-4 border-b border-slate-100">
                      <p className="font-bold text-slate-900">Purchase Created</p>
                      <p className="text-sm text-slate-500">{new Date(auditPurchase.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t sticky bottom-0">
              <button
                onClick={() => setAuditPurchase(null)}
                className="w-full py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Print Receipt Dialog */}
      <PrintReceipt
        open={showPrintDialog}
        onClose={() => { 
          setShowPrintDialog(false); 
          setPrintSale(null);
          setPrintPurchase(null);
        }}
        sale={printDialogType === 'sale' ? printSale : null}
        purchase={printDialogType === 'purchase' ? printPurchase : null}
        type={printDialogType}
        settings={settings}
      />
    </div>
  );
};

export default SalesHistory;
