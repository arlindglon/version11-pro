'use client';

import React, { useState, useMemo } from 'react';
import { Customer, Supplier, Sale, SaleItem, Purchase } from '@/types';
import { 
  Search, Plus, Eye, Trash2, Printer, Edit, Plus as PlusIcon, Minus, X, 
  ShoppingCart, DollarSign, Calendar, TrendingUp, Package, Phone, MapPin, Mail, 
  FileText, CreditCard, Wallet, Truck, History, RotateCcw, FileSearch, 
  MoreVertical, Receipt, Banknote
} from 'lucide-react';
import RecordHistory from './RecordHistory';
import { formatCurrency } from '@/contexts/LanguageContext';

interface Props {
  type: 'Customer' | 'Supplier';
  data: Customer[] | Supplier[];
  sales?: Sale[];
  purchases?: Purchase[];
  products?: { id: string; name: string; salePrice: number; purchasePrice?: number; stock: number; sku?: string; batchNumber?: string; expiryDate?: string }[];
  onAdd: (item: any) => void;
  onUpdate: (id: string, item: any) => void;
  onDelete: (id: string) => void;
  onUpdateSale?: (id: string, sale: Partial<Sale>) => void;
  onUpdatePurchase?: (id: string, purchase: Partial<Purchase>) => void;
  onDeleteSale?: (id: string) => void;
  onDeletePurchase?: (id: string) => void;
  settings: any;
  selectedId?: string | null;
  onClearSelected?: () => void;
  currentUserRole?: string;
  currentUserPermissions?: Record<string, boolean>;
}

const People: React.FC<Props> = ({ type, data, sales = [], purchases = [], products = [], onAdd, onUpdate, onDelete, onUpdateSale, onUpdatePurchase, onDeleteSale, onDeletePurchase, settings, selectedId, onClearSelected, currentUserRole, currentUserPermissions }) => {
  // Permission checks - ONLY Master Admin has full access, all others need explicit permissions
  const isMasterAdmin = currentUserRole === 'Master Admin';
  const canCreate = isMasterAdmin || (type === 'Customer' ? currentUserPermissions?.customers_create === true : currentUserPermissions?.suppliers_create === true);
  const canEdit = isMasterAdmin || (type === 'Customer' ? currentUserPermissions?.customers_edit === true : currentUserPermissions?.suppliers_edit === true);
  const canDelete = isMasterAdmin || (type === 'Customer' ? currentUserPermissions?.customers_delete === true : currentUserPermissions?.suppliers_delete === true);
  const canViewSales = isMasterAdmin || currentUserPermissions?.sales_view === true;
  const canViewPurchases = isMasterAdmin || currentUserPermissions?.purchases_view === true;
  const canEditSales = isMasterAdmin || currentUserPermissions?.sales_edit === true;
  const canDeleteSales = isMasterAdmin || currentUserPermissions?.sales_delete === true;
  const canReturnSales = isMasterAdmin || currentUserPermissions?.sales_return === true;
  const canEditPurchases = isMasterAdmin || currentUserPermissions?.purchases_edit === true;
  const canDeletePurchases = isMasterAdmin || currentUserPermissions?.purchases_delete === true;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [historyRecord, setHistoryRecord] = useState<{ type: string; id: string; name: string } | null>(null);
  
  // New states for payment and audit
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditRecord, setAuditRecord] = useState<{ type: 'sale' | 'purchase'; record: Sale | Purchase | null } | null>(null);
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);
  
  // Purchase specific states
  const [showPurchasePaymentModal, setShowPurchasePaymentModal] = useState(false);
  const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null);
  const [purchasePaymentAmount, setPurchasePaymentAmount] = useState('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('Cash');
  
  const [showPurchaseReturnModal, setShowPurchaseReturnModal] = useState(false);
  const [returningPurchase, setReturningPurchase] = useState<Purchase | null>(null);
  
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  
  // Track what type of item is being deleted
  const [deleteType, setDeleteType] = useState<'person' | 'sale' | 'purchase'>('person');
  
  // Determine selected person - either from prop or local state
  const effectiveSelectedPerson = useMemo(() => {
    if (selectedId) {
      return data.find(p => p.id === selectedId) || selectedPerson;
    }
    return selectedPerson;
  }, [selectedId, data, selectedPerson]);
  
  // Handle closing profile
  const handleCloseProfile = () => {
    setSelectedPerson(null);
    if (onClearSelected && selectedId) {
      onClearSelected();
    }
  };

  const filteredData = data.filter(item => 
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    ('phone' in item && item.phone && item.phone.includes(searchTerm)) ||
    ('contact' in item && item.contact && item.contact.includes(searchTerm))
  );

  // Helper function to normalize names for comparison
  const normalizeName = (name: string | undefined | null): string => {
    if (!name) return '';
    // Remove all non-alphanumeric characters and convert to lowercase
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  };

  // Get person's sales/purchase history - only if user has permission to view
  const personHistory = useMemo(() => {
    if (!effectiveSelectedPerson) return [];
    if (type === 'Customer') {
      // Only show sales history if user has permission to view sales
      if (!canViewSales) return [];
      return sales.filter(s => s.customerId === effectiveSelectedPerson.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      // Only show purchases history if user has permission to view purchases
      if (!canViewPurchases) return [];

      // Match by supplierId OR by supplier_name (fallback for old purchases without supplier_id)
      const matched = purchases.filter(p => {
        // Primary match: by supplierId (check if it's a real ID, not empty string)
        const hasRealSupplierId = p.supplierId && p.supplierId !== '' && p.supplierId !== null && p.supplierId !== undefined;

        if (hasRealSupplierId && p.supplierId === effectiveSelectedPerson.id) {
          return true;
        }

        // Fallback match: by supplier_name (for old purchases without supplier_id)
        if (!hasRealSupplierId && p.supplierName) {
          const normalizedPurchaseName = normalizeName(p.supplierName);
          const normalizedSupplierName = normalizeName(effectiveSelectedPerson.name);

          // Match if normalized names are equal
          if (normalizedPurchaseName && normalizedSupplierName && normalizedPurchaseName === normalizedSupplierName) {
            return true;
          }
        }
        return false;
      });

      return matched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [effectiveSelectedPerson, sales, purchases, type, canViewSales, canViewPurchases]);

  // Calculate statistics
  const customerStats = useMemo(() => {
    if (!effectiveSelectedPerson) return null;
    
    if (type === 'Customer') {
      const history = personHistory as Sale[];
      const totalOrders = history.length;
      const totalSpent = history.reduce((sum, sale) => sum + sale.total, 0);
      const totalPaid = history.reduce((sum, sale) => sum + sale.paid, 0);
      const totalDue = history.reduce((sum, sale) => sum + sale.due, 0);
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const completedOrders = history.filter(s => s.status === 'Completed').length;
      const pendingPayments = history.filter(s => s.paymentStatus !== 'Paid').length;
      
      return {
        totalOrders,
        totalSpent,
        totalPaid,
        totalDue,
        avgOrderValue,
        completedOrders,
        pendingPayments
      };
    } else {
      // Supplier stats
      const history = personHistory as Purchase[];
      const totalOrders = history.length;
      const totalAmount = history.reduce((sum, p) => sum + p.total, 0);
      const totalPaid = history.reduce((sum, p) => sum + p.paid, 0);
      const totalBalance = history.reduce((sum, p) => sum + p.balance, 0);
      const avgOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
      
      return {
        totalOrders,
        totalSpent: totalAmount,
        totalPaid,
        totalDue: totalBalance,
        avgOrderValue,
        completedOrders: totalOrders,
        pendingPayments: history.filter(p => p.paymentStatus !== 'Paid').length
      };
    }
  }, [selectedPerson, personHistory, type]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const contact = formData.get('contact') as string;
    const amount = Number(formData.get('amount') || 0);
    if (!name || !contact) return;
    
    if (type === 'Customer') {
      onAdd({ name, phone: contact, due: amount });
    } else {
      onAdd({ name, contact, balance: amount });
    }
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (deleteType === 'person') {
        await onDelete(itemToDelete.id);
      } else if (deleteType === 'sale' && onDeleteSale) {
        await onDeleteSale(itemToDelete.id);
      } else if (deleteType === 'purchase' && onDeletePurchase) {
        await onDeletePurchase(itemToDelete.id);
      }
      setItemToDelete(null);
      setDeleteType('person');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  // Helper function to get item name
  const getItemName = (item: SaleItem) => item.productName || item.name || 'Unknown Product';
  
  // Helper function to get item price
  const getItemPrice = (item: SaleItem) => item.unitPrice || item.price || 0;
  
  // Helper function to get item total
  const getItemTotal = (item: SaleItem) => item.totalPrice || item.total || 0;

  // Edit sale functions
  const updateEditItem = (productId: string, value: number) => {
    if (!editingSale) return;
    const newItems = editingSale.items.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, value);
        const unitPrice = getItemPrice(item);
        const totalPrice = newQty * unitPrice;
        return { ...item, quantity: newQty, totalPrice, total: totalPrice };
      }
      return item;
    });
    const subtotal = newItems.reduce((acc, item) => acc + getItemTotal(item), 0);
    const discount = editingSale.cartDiscount || 0;
    const total = subtotal - discount;
    setEditingSale({ ...editingSale, items: newItems, subtotal, total, due: Math.max(0, total - editingSale.paid) });
  };

  const removeEditItem = (productId: string) => {
    if (!editingSale) return;
    const newItems = editingSale.items.filter(item => item.productId !== productId);
    const subtotal = newItems.reduce((acc, item) => acc + getItemTotal(item), 0);
    const discount = editingSale.cartDiscount || 0;
    const total = subtotal - discount;
    setEditingSale({ ...editingSale, items: newItems, subtotal, total, due: Math.max(0, total - editingSale.paid) });
  };

  const addProductToEdit = (productId: string) => {
    if (!editingSale) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const exists = editingSale.items.find(item => item.productId === productId);
    if (exists) {
      updateEditItem(productId, exists.quantity + 1);
      return;
    }
    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      name: product.name,
      quantity: 1,
      unitPrice: product.salePrice,
      price: product.salePrice,
      totalPrice: product.salePrice,
      total: product.salePrice
    };
    const newItems = [...editingSale.items, newItem];
    const subtotal = newItems.reduce((acc, item) => acc + getItemTotal(item), 0);
    const discount = editingSale.cartDiscount || 0;
    const total = subtotal - discount;
    setEditingSale({ ...editingSale, items: newItems, subtotal, total, due: Math.max(0, total - editingSale.paid) });
  };

  const updateEditDiscount = (discount: number) => {
    if (!editingSale) return;
    const total = editingSale.subtotal - discount;
    setEditingSale({ ...editingSale, cartDiscount: discount, discount, total, due: Math.max(0, total - editingSale.paid) });
  };

  const updateEditPaid = (paid: number) => {
    if (!editingSale) return;
    setEditingSale({ ...editingSale, paid, due: Math.max(0, editingSale.total - paid) });
  };

  const saveEdit = () => {
    if (!editingSale || !onUpdateSale) return;
    onUpdateSale(editingSale.id, editingSale);
    setEditingSale(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{type} Management</h1>
          <p className="text-slate-500 text-sm mt-1">Track your {type.toLowerCase()} records and balances</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder={`Search ${type.toLowerCase()}s...`} 
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition ${
              canCreate 
                ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!canCreate}
          >
            <Plus className="w-4 h-4" />
            <span>Add {type}</span>
          </button>
        </div>
      </div>

      {/* Customer/Supplier Cards - Mobile & Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredData.map(item => {
          const customerSales = type === 'Customer' ? sales.filter(s => s.customerId === item.id) : [];
          // Match purchases by supplierId OR by supplier_name (fallback for old purchases)
          const supplierPurchases = type === 'Supplier' ? purchases.filter(p => {
            // Primary: match by supplierId
            const hasRealSupplierId = p.supplierId && p.supplierId !== '' && p.supplierId !== null;
            if (hasRealSupplierId && p.supplierId === item.id) return true;

            // Fallback: match by normalized supplier_name
            if (!hasRealSupplierId && p.supplierName) {
              const normalizedPurchaseName = normalizeName(p.supplierName);
              const normalizedSupplierName = normalizeName(item.name);
              return normalizedPurchaseName && normalizedSupplierName && normalizedPurchaseName === normalizedSupplierName;
            }
            return false;
          }) : [];
          const totalAmount = type === 'Customer'
            ? customerSales.reduce((sum, s) => sum + s.total, 0)
            : supplierPurchases.reduce((sum, p) => sum + p.total, 0);
          const totalOrders = type === 'Customer' ? customerSales.length : supplierPurchases.length;

          // Calculate due/balance from actual transactions
          const totalDue = type === 'Customer'
            ? customerSales.reduce((sum, s) => sum + (s.due || 0), 0)
            : supplierPurchases.reduce((sum, p) => sum + (p.balance || 0), 0);
          
          return (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
              onClick={() => setSelectedPerson(item)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg group-hover:scale-105 transition ${
                    type === 'Customer' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' 
                      : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30'
                  }`}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-blue-600 font-medium">View History →</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setHistoryRecord({ type: type === 'Customer' ? 'customers' : 'suppliers', id: item.id, name: item.name }); }} 
                    className="p-2 text-slate-300 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
                    title="View History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteType('person'); setItemToDelete(item); }} 
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{'phone' in item ? item.phone : 'contact' in item ? item.contact : 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Total Orders</span>
                  <span className="font-bold text-slate-900">{totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{type === 'Customer' ? 'Total Spent' : 'Total Purchases'}</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{type === 'Customer' ? 'Current Due' : 'Payable Balance'}</span>
                  <span className={`font-bold ${totalDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {formatCurrency(totalDue)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-600">No {type.toLowerCase()}s found</p>
          <p className="text-slate-400 text-sm mt-1">Add your first {type.toLowerCase()} to get started</p>
        </div>
      )}

      {/* Customer Detail Modal - Full History */}
      {effectiveSelectedPerson && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-[32px] w-full max-w-5xl max-h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden my-4">
            {/* Header */}
            <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl shadow-blue-500/30">
                    {effectiveSelectedPerson.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{effectiveSelectedPerson.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {effectiveSelectedPerson.phone || effectiveSelectedPerson.contact}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs">ID: #{effectiveSelectedPerson.id.slice(0, 6).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCloseProfile} 
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats Cards - Customer Only */}
            {type === 'Customer' && customerStats && (
              <div className="px-4 sm:px-6 lg:px-8 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-xs font-medium">Orders</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{customerStats.totalOrders}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">Total Spent</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(customerStats.totalSpent)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium">Paid</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(customerStats.totalPaid)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-medium">Due</span>
                    </div>
                    <p className={`text-xl font-bold ${customerStats.totalDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>{formatCurrency(customerStats.totalDue)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">Avg Order</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(customerStats.avgOrderValue)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{customerStats.completedOrders}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600">{customerStats.pendingPayments}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards - Supplier Only */}
            {type === 'Supplier' && customerStats && (
              <div className="px-4 sm:px-6 lg:px-8 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Truck className="w-4 h-4" />
                      <span className="text-xs font-medium">Orders</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{customerStats.totalOrders}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">Total Purchase</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(customerStats.totalSpent)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium">Paid</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(customerStats.totalPaid)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-medium">Balance</span>
                    </div>
                    <p className={`text-xl font-bold ${customerStats.totalDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>{formatCurrency(customerStats.totalDue)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">Avg Order</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(customerStats.avgOrderValue)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600">{customerStats.pendingPayments}</p>
                  </div>
                </div>
              </div>
            )}

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                {type === 'Customer' ? <ShoppingCart className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                {type === 'Customer' ? 'Purchase History' : 'Purchase Orders'} ({personHistory.length})
              </h3>

              {personHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
                  {type === 'Customer' ? <ShoppingCart className="w-16 h-16 mb-4 opacity-50" /> : <Truck className="w-16 h-16 mb-4 opacity-50" />}
                  <p className="font-bold">No {type === 'Customer' ? 'purchase' : 'supply'} history</p>
                  <p className="text-sm mt-1">This {type.toLowerCase()} hasn&apos;t made any {type === 'Customer' ? 'purchases' : 'supplies'} yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personHistory.map((record) => {
                    const sale = type === 'Customer' ? record as Sale : null;
                    const purchase = type === 'Supplier' ? record as Purchase : null;
                    const id = sale?.id || purchase?.id || '';
                    const date = sale?.date || purchase?.date || new Date();
                    const total = sale?.total || purchase?.total || 0;
                    const paid = sale?.paid || purchase?.paid || 0;
                    const due = sale?.due || purchase?.balance || 0;
                    const paymentStatus = sale?.paymentStatus || purchase?.paymentStatus || 'Pending';
                    const status = sale?.status || purchase?.status || 'Pending';
                    const items = sale?.items || purchase?.items || [];
                    
                    return (
                      <div 
                        key={id} 
                        className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Date & Invoice */}
                          <div className="flex items-center gap-4">
                            <div className="bg-slate-100 px-3 py-2 rounded-lg text-center min-w-[60px]">
                              <p className="text-xs font-bold text-slate-500 uppercase">
                                {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {new Date(date).getDate()}
                              </p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm sm:text-base">
                                #{(purchase?.purchaseNumber || id.slice(0, 8)).toUpperCase()}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  paymentStatus === 'Paid' 
                                    ? 'bg-green-100 text-green-700' 
                                    : paymentStatus === 'Partial' 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {paymentStatus}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  status === 'Completed' || status === 'Received'
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {status}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {items.length} items
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Amounts & Actions Container */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                            {/* Amounts Grid - Mobile Friendly */}
                            <div className="grid grid-cols-3 gap-2 text-sm w-full sm:w-auto sm:flex sm:gap-6">
                              <div className="text-center sm:text-right bg-slate-50 p-2 rounded-lg sm:bg-transparent sm:p-0">
                                <p className="text-xs text-slate-500">Total</p>
                                <p className="font-bold text-slate-900">{formatCurrency(total)}</p>
                              </div>
                              <div className="text-center sm:text-right bg-green-50 p-2 rounded-lg sm:bg-transparent sm:p-0">
                                <p className="text-xs text-slate-500">Paid</p>
                                <p className="font-bold text-green-600">{formatCurrency(paid)}</p>
                              </div>
                              <div className="text-center sm:text-right bg-red-50 p-2 rounded-lg sm:bg-transparent sm:p-0">
                                <p className="text-xs text-slate-500">{type === 'Customer' ? 'Due' : 'Balance'}</p>
                                <p className={`font-bold ${due > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                  {formatCurrency(due)}
                                </p>
                              </div>
                            </div>

                            {/* Actions - Scrollable on Mobile */}
                            <div className="flex gap-1 flex-wrap sm:flex-nowrap w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                              {/* View */}
                              <button 
                                onClick={() => sale ? setViewingSale(sale) : purchase && setViewingPurchase(purchase)} 
                                className="w-8 h-8 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {/* Purchase Actions */}
                              {purchase && (
                                <>
                                  {/* Print Thermal */}
                                  <button 
                                    onClick={() => {
                                      const printWindow = window.open('', '_blank');
                                      if (printWindow) {
                                        printWindow.document.write(`
                                          <html><head><title>Purchase Order</title>
                                          <style>
                                            body { font-family: monospace; font-size: 12px; width: 280px; padding: 10px; }
                                            .center { text-align: center; } .bold { font-weight: bold; }
                                            .divider { border-top: 1px dashed #000; margin: 8px 0; }
                                            .row { display: flex; justify-content: space-between; margin: 4px 0; }
                                          </style></head>
                                          <body>
                                            <div class="center bold">${settings?.shopName || 'Dokan'}</div>
                                            <div class="center" style="font-size:10px">PURCHASE ORDER</div>
                                            <div class="divider"></div>
                                            <div class="row"><span>PO #:</span><span>${purchase.purchaseNumber || purchase.id.slice(0, 8).toUpperCase()}</span></div>
                                            <div class="row"><span>Date:</span><span>${new Date(purchase.date).toLocaleDateString()}</span></div>
                                            <div class="row"><span>Supplier:</span><span>${purchase.supplierName}</span></div>
                                            <div class="divider"></div>
                                            ${purchase.items.map((item: any) => `<div class="row"><span>${item.productName || 'Product'} x${item.quantity}</span><span>${formatCurrency(item.totalPrice || 0)}</span></div>`).join('')}
                                            <div class="divider"></div>
                                            <div class="row bold"><span>TOTAL:</span><span>${formatCurrency(purchase.total)}</span></div>
                                            <div class="row"><span>Paid:</span><span>${formatCurrency(purchase.paid)}</span></div>
                                            <div class="row"><span>Balance:</span><span>${formatCurrency(purchase.balance)}</span></div>
                                            <div class="divider"></div>
                                            <div class="center" style="font-size:10px">${new Date().toLocaleString()}</div>
                                          </body></html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.print();
                                      }
                                    }}
                                    className="w-8 h-8 bg-orange-100 hover:bg-orange-600 text-orange-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                    title="Print Thermal"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Print */}
                                  <button 
                                    onClick={() => setViewingPurchase(purchase)} 
                                    className="w-8 h-8 bg-slate-100 hover:bg-slate-600 text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                    title="Print"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Edit - Only with permission */}
                                  {canEditPurchases && (
                                    <button 
                                      onClick={() => setEditingPurchase({...purchase})} 
                                      className="w-8 h-8 bg-green-100 hover:bg-green-600 text-green-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Payment - Only with edit permission */}
                                  {canEditPurchases && purchase.balance > 0 && (
                                    <button 
                                      onClick={() => { setPaymentPurchase(purchase); setShowPurchasePaymentModal(true); }} 
                                      className="w-8 h-8 bg-emerald-100 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                      title="Make Payment"
                                    >
                                      <Banknote className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Audit */}
                                  <button 
                                    onClick={() => { setAuditRecord({ type: 'purchase', record: purchase }); setShowAuditModal(true); }} 
                                    className="w-8 h-8 bg-purple-100 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                    title="Audit"
                                  >
                                    <FileSearch className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Delete - Only with permission */}
                                  {canDeletePurchases && (
                                    <button 
                                      onClick={() => { setDeleteType('purchase'); setItemToDelete(purchase); }} 
                                      className="w-8 h-8 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {/* Sale Actions */}
                              {sale && (
                                <>
                                  {/* Print Thermal */}
                                  <button 
                                    onClick={() => {
                                      // Quick thermal print
                                      const printWindow = window.open('', '_blank');
                                      if (printWindow) {
                                        printWindow.document.write(`
                                          <html><head><title>Receipt</title>
                                          <style>
                                            body { font-family: monospace; font-size: 12px; width: 280px; padding: 10px; }
                                            .center { text-align: center; } .bold { font-weight: bold; }
                                            .divider { border-top: 1px dashed #000; margin: 8px 0; }
                                            .row { display: flex; justify-content: space-between; margin: 4px 0; }
                                          </style></head>
                                          <body>
                                            <div class="center bold">${settings?.shopName || 'Dokan'}</div>
                                            <div class="divider"></div>
                                            <div class="row"><span>Invoice:</span><span>#${sale.id.slice(0, 8).toUpperCase()}</span></div>
                                            <div class="row"><span>Date:</span><span>${new Date(sale.date).toLocaleDateString()}</span></div>
                                            <div class="row"><span>Customer:</span><span>${sale.customerName}</span></div>
                                            <div class="divider"></div>
                                            ${sale.items.map((item: SaleItem) => `<div class="row"><span>${item.productName || item.name} x${item.quantity}</span><span>${formatCurrency(item.totalPrice || item.total || 0)}</span></div>`).join('')}
                                            <div class="divider"></div>
                                            <div class="row bold"><span>TOTAL:</span><span>${formatCurrency(sale.total)}</span></div>
                                            <div class="row"><span>Paid:</span><span>${formatCurrency(sale.paid)}</span></div>
                                            <div class="row"><span>Due:</span><span>${formatCurrency(sale.due)}</span></div>
                                            <div class="divider"></div>
                                            <div class="center">Thank you!</div>
                                          </body></html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.print();
                                      }
                                    }}
                                    className="w-8 h-8 bg-orange-100 hover:bg-orange-600 text-orange-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                    title="Print Thermal"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Print */}
                                  <button 
                                    onClick={() => setViewingSale(sale)} 
                                    className="w-8 h-8 bg-slate-100 hover:bg-slate-600 text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                    title="Print"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Edit - Only with permission */}
                                  {canEditSales && (
                                    <button 
                                      onClick={() => setEditingSale({...sale})} 
                                      className="w-8 h-8 bg-green-100 hover:bg-green-600 text-green-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Payment - Only with edit permission */}
                                  {canEditSales && sale.due > 0 && (
                                    <button 
                                      onClick={() => { setPaymentSale(sale); setShowPaymentModal(true); }} 
                                      className="w-8 h-8 bg-emerald-100 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                      title="Payment"
                                    >
                                      <Banknote className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Audit */}
                                  <button 
                                    onClick={() => { setAuditRecord({ type: 'sale', record: sale }); setShowAuditModal(true); }} 
                                    className="w-8 h-8 bg-purple-100 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                    title="Audit"
                                  >
                                    <FileSearch className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Delete - Only with permission */}
                                  {canDeleteSales && (
                                    <button 
                                      onClick={() => { setDeleteType('sale'); setItemToDelete(sale); }} 
                                      className="w-8 h-8 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-lg flex items-center justify-center transition"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Items Preview */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500 font-medium mb-2">Items:</p>
                          <div className="flex flex-wrap gap-2">
                            {items.slice(0, 4).map((item, idx) => (
                              <span 
                                key={idx} 
                                className="text-xs bg-slate-50 px-2 py-1 rounded-md text-slate-600"
                              >
                                {(item.productName || item.name || 'Product')} × {item.quantity}
                              </span>
                            ))}
                            {items.length > 4 && (
                              <span className="text-xs bg-blue-50 px-2 py-1 rounded-md text-blue-600 font-medium">
                                +{items.length - 4} more
                              </span>
                            )}
                          </div>
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

      {/* View Sale Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col rounded-2xl overflow-hidden my-4">
            <button 
              onClick={() => setViewingSale(null)} 
              className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 z-50 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex-1 p-6 sm:p-8 lg:p-12 bg-white text-slate-900 overflow-y-auto" id="printable-area">
              {/* Invoice Header */}
              <div className="border-b-4 border-slate-900 pb-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-slate-900">
                  {settings?.shopName || 'Dokan'}
                </h1>
                <p className="text-sm font-bold text-blue-600 mt-1">{settings?.shopBio || ''}</p>
                <p className="text-xs text-slate-500 mt-2">{settings?.shopAddress || ''} | {settings?.shopContact || ''}</p>
              </div>

              {/* Customer & Invoice Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-slate-900 p-4 sm:p-6 rounded-2xl text-white">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer</p>
                  <p className="text-lg font-bold">{viewingSale.customerName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Invoice ID</p>
                  <p className="text-lg font-bold font-mono">#{viewingSale.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(viewingSale.date).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-900">
                      <th className="py-3 px-3 text-left text-xs font-bold uppercase">Item</th>
                      <th className="py-3 px-3 text-center text-xs font-bold uppercase">Qty</th>
                      <th className="py-3 px-3 text-right text-xs font-bold uppercase">Price</th>
                      <th className="py-3 px-3 text-right text-xs font-bold uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
                    {viewingSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3 font-medium text-sm">{getItemName(item)}</td>
                        <td className="py-3 px-3 text-sm text-center">{item.quantity}</td>
                        <td className="py-3 px-3 text-sm text-right">{formatCurrency(getItemPrice(item))}</td>
                        <td className="py-3 px-3 text-sm text-right font-bold">{formatCurrency(getItemTotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 sm:w-72 space-y-2">
                  <div className="flex justify-between py-2 px-3 border-b text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold">{formatCurrency(viewingSale.subtotal)}</span>
                  </div>
                  {(viewingSale.cartDiscount > 0 || viewingSale.itemDiscount > 0) && (
                    <div className="flex justify-between py-2 px-3 border-b text-sm">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-bold text-red-600">-{formatCurrency(viewingSale.cartDiscount + (viewingSale.itemDiscount || 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 px-3 border-b text-sm">
                    <span className="text-slate-500">Paid</span>
                    <span className="font-bold text-green-600">{formatCurrency(viewingSale.paid)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-3 border-b text-sm">
                    <span className="text-slate-500">Due</span>
                    <span className={`font-bold ${viewingSale.due > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {formatCurrency(viewingSale.due)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl mt-2">
                    <span className="text-xs font-bold uppercase">Total</span>
                    <span className="text-2xl font-black">{formatCurrency(viewingSale.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => { setEditingSale({...viewingSale}); setViewingSale(null); }} 
                className="flex-1 py-3 sm:py-4 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-3xl shadow-2xl relative flex flex-col rounded-2xl overflow-hidden my-4">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Edit Sale #{editingSale.id.slice(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-slate-500">Customer: {editingSale.customerName}</p>
              </div>
              <button 
                onClick={() => setEditingSale(null)} 
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Items */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Items</h3>
                <div className="space-y-2">
                  {editingSale.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{getItemName(item)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Price Input */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                          <span className="text-xs text-slate-400">$</span>
                          <input 
                            type="number" 
                            value={getItemPrice(item)} 
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              const newItems = editingSale.items.map(i => 
                                i.productId === item.productId 
                                  ? { ...i, unitPrice: newPrice, price: newPrice, totalPrice: (i.quantity || 0) * newPrice, total: (i.quantity || 0) * newPrice }
                                  : i
                              );
                              const subtotal = newItems.reduce((acc, i) => acc + getItemTotal(i), 0);
                              const discount = editingSale.cartDiscount || 0;
                              const total = subtotal - discount;
                              setEditingSale({ ...editingSale, items: newItems, subtotal, total, due: Math.max(0, total - editingSale.paid) });
                            }}
                            className="w-14 text-center font-bold bg-transparent outline-none text-sm"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        {/* Quantity Control */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                          <button 
                            onClick={() => updateEditItem(item.productId, item.quantity - 1)} 
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-md hover:bg-slate-200 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateEditItem(item.productId, parseInt(e.target.value) || 1)}
                            className="w-8 text-center font-bold bg-transparent outline-none text-sm"
                          />
                          <button 
                            onClick={() => updateEditItem(item.productId, item.quantity + 1)} 
                            className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="w-16 text-right font-bold text-sm">{formatCurrency(getItemTotal(item))}</p>
                        <button 
                          onClick={() => removeEditItem(item.productId)} 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
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
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                    onChange={(e) => { if (e.target.value) { addProductToEdit(e.target.value); e.target.value = ''; } }}
                    value=""
                  >
                    <option value="">+ Add Product</option>
                    {products.filter(p => !editingSale.items.find(i => i.productId === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.salePrice)}) - Stock: {p.stock}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Discount</label>
                  <input 
                    type="number" 
                    value={editingSale.cartDiscount || 0} 
                    onChange={(e) => updateEditDiscount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Paid Amount</label>
                  <input 
                    type="number" 
                    value={editingSale.paid || 0} 
                    onChange={(e) => updateEditPaid(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-2xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Subtotal</p>
                    <p className="text-xl sm:text-2xl font-black">{formatCurrency(editingSale.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-xl sm:text-2xl font-black">{formatCurrency(editingSale.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Due</p>
                    <p className="text-xl sm:text-2xl font-black text-red-400">{formatCurrency(editingSale.due)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t flex flex-col sm:flex-row gap-3 shrink-0">
              <button 
                onClick={() => setEditingSale(null)} 
                className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit} 
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900">
              {deleteType === 'person' ? `Delete ${type}?` : 
               deleteType === 'sale' ? 'Delete Sale?' : 
               'Delete Purchase?'}
            </h3>
            <p className="text-slate-500 text-center mt-2">
              {deleteType === 'person' ? (
                <>Are you sure you want to delete <span className="font-bold text-slate-900">&quot;{itemToDelete.name}&quot;</span>? This action cannot be undone.</>
              ) : deleteType === 'sale' ? (
                <>Are you sure you want to delete Sale <span className="font-bold text-slate-900">#{itemToDelete.id?.slice(0, 8).toUpperCase()}</span>? This will restore stock and update customer due. This action cannot be undone.</>
              ) : (
                <>Are you sure you want to delete Purchase <span className="font-bold text-slate-900">#{itemToDelete.purchaseNumber || itemToDelete.id?.slice(0, 8).toUpperCase()}</span>? This will reduce stock and update supplier balance. This action cannot be undone.</>
              )}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => { setItemToDelete(null); setDeleteType('person'); }} 
                className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New {type}</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Name</label>
                <input 
                  name="name" 
                  required 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" 
                  placeholder="Enter full name" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  {type === 'Customer' ? 'Phone Number' : 'Contact'}
                </label>
                <input 
                  name="contact" 
                  required 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" 
                  placeholder="Enter phone number" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Initial {type === 'Customer' ? 'Due' : 'Balance'}
                </label>
                <input 
                  type="number" 
                  name="amount" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" 
                  placeholder="0.00" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
              >
                Add {type}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl shadow-2xl relative flex flex-col rounded-2xl overflow-hidden my-4">
            <button 
              onClick={() => setViewingPurchase(null)} 
              className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 z-50 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex-1 p-6 sm:p-8 bg-white text-slate-900 overflow-y-auto">
              {/* Header */}
              <div className="text-center border-b pb-6 mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Purchase Order</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  #{viewingPurchase.purchaseNumber || viewingPurchase.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              
              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supplier</p>
                  <p className="font-bold text-slate-900">{viewingPurchase.supplierName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
                  <p className="font-bold text-slate-900">{new Date(viewingPurchase.date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-400">
                    <th className="text-left py-2">Product Name</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingPurchase.items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-50 text-xs">
                      <td className="py-3 font-bold uppercase">{item.productName || 'Product'}</td>
                      <td className="text-center font-bold">{item.quantity}</td>
                      <td className="text-right font-bold">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="flex justify-between items-end pt-4">
                <div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${viewingPurchase.balance > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {viewingPurchase.balance > 0 ? `Due: $${viewingPurchase.balance.toFixed(2)}` : 'Fully Paid'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-3xl font-black tracking-tighter">${viewingPurchase.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 bg-slate-50 border-t flex gap-3 shrink-0">
              <button 
                onClick={() => setViewingPurchase(null)} 
                className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition"
              >
                <Printer className="w-5 h-5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record History Modal */}
      {historyRecord && (
        <RecordHistory
          entityType={historyRecord.type}
          entityId={historyRecord.id}
          entityName={historyRecord.name}
          onClose={() => setHistoryRecord(null)}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <h2 className="text-lg font-bold text-emerald-800">Collect Payment</h2>
              <button onClick={() => { setShowPaymentModal(false); setPaymentSale(null); setPaymentAmount(''); }} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Invoice</span>
                  <span className="font-bold">#{paymentSale.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold">{formatCurrency(paymentSale.total)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-bold text-green-600">{formatCurrency(paymentSale.paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due</span>
                  <span className="font-bold text-red-600">{formatCurrency(paymentSale.due)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Payment Amount</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border rounded-xl mt-1"
                  placeholder="Enter amount"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setPaymentAmount(paymentSale.due.toString())} className="px-3 py-1 text-xs bg-slate-100 rounded-lg hover:bg-slate-200">Full Amount</button>
                  <button onClick={() => setPaymentAmount((paymentSale.due / 2).toFixed(2))} className="px-3 py-1 text-xs bg-slate-100 rounded-lg hover:bg-slate-200">Half</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 border rounded-xl mt-1">
                  <option value="Cash">💵 Cash</option>
                  <option value="bKash">📱 bKash</option>
                  <option value="Nagad">📱 Nagad</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPaymentModal(false); setPaymentSale(null); setPaymentAmount(''); }} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold">Cancel</button>
                <button 
                  onClick={async () => {
                    if (paymentAmount && onUpdateSale) {
                      const amount = parseFloat(paymentAmount);
                      const newPaid = paymentSale.paid + amount;
                      const newDue = Math.max(0, paymentSale.due - amount);
                      
                      // Update the sale with payment method for tracking
                      await onUpdateSale(paymentSale.id, { 
                        paid: newPaid, 
                        due: newDue, 
                        paymentMethod: paymentMethod,
                        paymentStatus: newDue === 0 ? 'Paid' : 'Partial' 
                      });
                      
                      setShowPaymentModal(false);
                      setPaymentSale(null);
                      setPaymentAmount('');
                    }
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && returningSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <h2 className="text-lg font-bold text-amber-800">Return Items</h2>
              <button onClick={() => { setShowReturnModal(false); setReturningSale(null); }} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Select items to return from Invoice #{returningSale.id.slice(0, 8).toUpperCase()}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {returningSale.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4" id={`return-${idx}`} />
                      <label htmlFor={`return-${idx}`} className="cursor-pointer">
                        <p className="font-medium">{item.productName || item.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}</p>
                      </label>
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalPrice || item.total || 0)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowReturnModal(false); setReturningSale(null); }} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold">Cancel</button>
                <button className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold">Process Return</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Payment Modal */}
      {showPurchasePaymentModal && paymentPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <h2 className="text-lg font-bold text-emerald-800">Make Payment to Supplier</h2>
              <button onClick={() => { setShowPurchasePaymentModal(false); setPaymentPurchase(null); setPurchasePaymentAmount(''); }} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">PO #</span>
                  <span className="font-bold">{paymentPurchase.purchaseNumber || paymentPurchase.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Supplier</span>
                  <span className="font-bold">{paymentPurchase.supplierName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold">{formatCurrency(paymentPurchase.total)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-bold text-green-600">{formatCurrency(paymentPurchase.paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance</span>
                  <span className="font-bold text-red-600">{formatCurrency(paymentPurchase.balance)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Payment Amount</label>
                <input 
                  type="number" 
                  value={purchasePaymentAmount} 
                  onChange={(e) => setPurchasePaymentAmount(e.target.value)}
                  className="w-full p-3 border rounded-xl mt-1"
                  placeholder="Enter amount"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setPurchasePaymentAmount(paymentPurchase.balance.toString())} className="px-3 py-1 text-xs bg-slate-100 rounded-lg hover:bg-slate-200">Full Amount</button>
                  <button onClick={() => setPurchasePaymentAmount((paymentPurchase.balance / 2).toFixed(2))} className="px-3 py-1 text-xs bg-slate-100 rounded-lg hover:bg-slate-200">Half</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Payment Method</label>
                <select value={purchasePaymentMethod} onChange={(e) => setPurchasePaymentMethod(e.target.value)} className="w-full p-3 border rounded-xl mt-1">
                  <option value="Cash">💵 Cash</option>
                  <option value="bKash">📱 bKash</option>
                  <option value="Nagad">📱 Nagad</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPurchasePaymentModal(false); setPaymentPurchase(null); setPurchasePaymentAmount(''); }} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold">Cancel</button>
                <button 
                  onClick={async () => {
                    if (purchasePaymentAmount && onUpdatePurchase) {
                      const amount = parseFloat(purchasePaymentAmount);
                      const newPaid = paymentPurchase.paid + amount;
                      const newBalance = Math.max(0, paymentPurchase.balance - amount);
                      
                      // Update the purchase via callback
                      await onUpdatePurchase(paymentPurchase.id, { 
                        paid: newPaid, 
                        balance: newBalance, 
                        paymentMethod: purchasePaymentMethod,
                        paymentStatus: newBalance === 0 ? 'Paid' : 'Partial' 
                      });
                      
                      setShowPurchasePaymentModal(false);
                      setPaymentPurchase(null);
                      setPurchasePaymentAmount('');
                    }
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Return Modal */}
      {showPurchaseReturnModal && returningPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <h2 className="text-lg font-bold text-amber-800">Return Purchase Items</h2>
              <button onClick={() => { setShowPurchaseReturnModal(false); setReturningPurchase(null); }} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Select items to return from PO #{returningPurchase.purchaseNumber || returningPurchase.id.slice(0, 8).toUpperCase()}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {returningPurchase.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4" id={`preturn-${idx}`} />
                      <label htmlFor={`preturn-${idx}`} className="cursor-pointer">
                        <p className="font-medium">{item.productName || 'Product'}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice || 0)}</p>
                      </label>
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalPrice || 0)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowPurchaseReturnModal(false); setReturningPurchase(null); }} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold">Cancel</button>
                <button className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold">Process Return</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Edit Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-green-50 shrink-0">
              <h2 className="text-lg font-bold text-green-800">Edit Purchase Order</h2>
              <button onClick={() => setEditingPurchase(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">PO Number</label>
                      <input type="text" value={editingPurchase.purchaseNumber || ''} readOnly className="w-full p-2 border rounded-lg bg-slate-100 mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Supplier</label>
                      <input type="text" value={editingPurchase.supplierName} readOnly className="w-full p-2 border rounded-lg bg-slate-100 mt-1" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">Items ({(editingPurchase.items || []).length})</h4>
                  {editingPurchase.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName || 'Product'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Price Input */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                          <span className="text-xs text-slate-400">$</span>
                          <input
                            type="number"
                            value={item.unitPrice || 0}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              const newItems = [...editingPurchase.items];
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
                            className="w-14 text-center font-bold bg-transparent outline-none text-sm"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        {/* Quantity Control */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                          <button
                            onClick={() => {
                              const newQty = Math.max(1, (item.quantity || 1) - 1);
                              const newItems = [...editingPurchase.items];
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
                            className="w-6 h-6 bg-slate-100 rounded text-slate-600 font-bold hover:bg-slate-200"
                          >−</button>
                          <input
                            type="number"
                            value={item.quantity || 0}
                            onChange={(e) => {
                              const newQty = Math.max(1, parseInt(e.target.value) || 1);
                              const newItems = [...editingPurchase.items];
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
                            className="w-8 text-center font-bold bg-transparent outline-none text-sm"
                          />
                          <button
                            onClick={() => {
                              const newQty = (item.quantity || 0) + 1;
                              const newItems = [...editingPurchase.items];
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
                            className="w-6 h-6 bg-teal-600 text-white rounded font-bold hover:bg-teal-700"
                          >+</button>
                        </div>
                        <span className="font-bold w-16 text-right text-sm">{formatCurrency(item.totalPrice || 0)}</span>
                        <button
                          onClick={() => {
                            if ((editingPurchase.items || []).length <= 1) {
                              alert('Cannot remove the last item');
                              return;
                            }
                            const newItems = editingPurchase.items.filter((_, i) => i !== idx);
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
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Product Dropdown */}
                  <div className="mt-3">
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const product = products.find(p => p.id === e.target.value);
                        if (!product) return;
                        
                        const existingItem = editingPurchase.items.find(i => i.productId === product.id);
                        let newItems;
                        
                        if (existingItem) {
                          newItems = editingPurchase.items.map(i => 
                            i.productId === product.id 
                              ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * (i.unitPrice || 0) }
                              : i
                          );
                        } else {
                          newItems = [...editingPurchase.items, {
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
                        .filter(p => !editingPurchase.items.find(i => i.productId === p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {formatCurrency(p.purchasePrice)} (Stock: {p.stock})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Discount</label>
                    <input 
                      type="number" 
                      value={editingPurchase.discount || 0}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0;
                        const total = editingPurchase.subtotal - discount;
                        setEditingPurchase({
                          ...editingPurchase,
                          discount,
                          total,
                          balance: Math.max(0, total - editingPurchase.paid)
                        });
                      }}
                      className="w-full p-2 border rounded-lg mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Paid Amount</label>
                    <input 
                      type="number" 
                      value={editingPurchase.paid}
                      onChange={(e) => {
                        const paid = parseFloat(e.target.value) || 0;
                        setEditingPurchase({
                          ...editingPurchase,
                          paid,
                          balance: Math.max(0, editingPurchase.total - paid)
                        });
                      }}
                      className="w-full p-2 border rounded-lg mt-1" 
                    />
                  </div>
                </div>
                
                <div className="bg-slate-900 text-white p-4 rounded-xl">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                      <p className="text-lg font-black">{formatCurrency(editingPurchase.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Paid</p>
                      <p className="text-lg font-black text-green-400">{formatCurrency(editingPurchase.paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Balance</p>
                      <p className="text-lg font-black text-red-400">{formatCurrency(editingPurchase.balance)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 shrink-0">
              <button onClick={() => setEditingPurchase(null)} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold">Cancel</button>
              <button 
                onClick={async () => {
                  await fetch(`/api/purchases/${editingPurchase.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingPurchase),
                  });
                  setEditingPurchase(null);
                  window.location.reload();
                }}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAuditModal && auditRecord && auditRecord.record && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-50 shrink-0">
              <h2 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                <FileSearch className="w-5 h-5" />
                Audit Trail
              </h2>
              <button onClick={() => { setShowAuditModal(false); setAuditRecord(null); }} className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {/* Record Info */}
              <div className="bg-slate-50 p-4 rounded-xl mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Type</span>
                  <span className="font-bold capitalize">{auditRecord.type}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">ID</span>
                  <span className="font-bold">#{auditRecord.type === 'purchase' ? ((auditRecord.record as Purchase).purchaseNumber || auditRecord.record.id.slice(0, 8)).toUpperCase() : auditRecord.record.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">{auditRecord.type === 'purchase' ? 'Supplier' : 'Customer'}</span>
                  <span className="font-bold">{auditRecord.type === 'purchase' ? (auditRecord.record as Purchase).supplierName : (auditRecord.record as Sale).customerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-bold">{new Date(auditRecord.record.date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* History Timeline */}
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">History</h3>
              
              {(() => {
                const isPurchase = auditRecord.type === 'purchase';
                const purchase = isPurchase ? (auditRecord.record as Purchase) : null;
                const sale = !isPurchase ? (auditRecord.record as Sale) : null;
                
                const history = (auditRecord.record as any).history || [];
                const payments = (auditRecord.record as any).payments || [];
                const total = auditRecord.record.total;
                const paid = auditRecord.record.paid || 0;
                const dueOrBalance = isPurchase ? (purchase?.balance || 0) : (sale?.due || 0);
                
                // Build events list from available data
                const allEvents: any[] = [];
                
                // Add creation event
                allEvents.push({
                  type: 'create',
                  description: `${isPurchase ? 'Purchase' : 'Sale'} created - ${auditRecord.record.items?.length || 0} items`,
                  date: auditRecord.record.createdAt || auditRecord.record.date,
                  amount: total,
                  paymentMethod: (auditRecord.record as any).paymentMethod,
                });
                
                // Add initial payment if any was made at creation
                if (paid > 0) {
                  const totalFromPayments = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                  const initialPayment = paid - totalFromPayments;
                  
                  if (initialPayment > 0) {
                    allEvents.push({
                      type: 'payment',
                      description: `Initial payment: ${formatCurrency(initialPayment)} via ${(auditRecord.record as any).paymentMethod || 'Cash'}`,
                      date: auditRecord.record.createdAt || auditRecord.record.date,
                      amount: initialPayment,
                      paymentMethod: (auditRecord.record as any).paymentMethod,
                    });
                  }
                }
                
                // Add payment entries from payments array
                payments.forEach((p: any) => {
                  allEvents.push({
                    type: 'payment',
                    description: `${isPurchase ? 'Payment made' : 'Payment received'}: ${formatCurrency(p.amount)} via ${p.paymentMethod || 'Cash'}`,
                    date: p.createdAt || auditRecord.record.updatedAt,
                    amount: p.amount,
                    paymentMethod: p.paymentMethod,
                  });
                });
                
                // Add history entries
                history.forEach((h: any) => {
                  allEvents.push({
                    type: h.action,
                    description: h.description,
                    date: h.createdAt,
                    amount: h.amount,
                    paymentMethod: h.paymentMethod,
                    userName: h.userName,
                  });
                });
                
                // If there's still due/balance, add pending payment info
                if (dueOrBalance > 0) {
                  allEvents.push({
                    type: 'pending',
                    description: `Pending ${isPurchase ? 'payment to supplier' : 'payment from customer'}: ${formatCurrency(dueOrBalance)}`,
                    date: new Date().toISOString(),
                    amount: dueOrBalance,
                  });
                }
                
                // Sort by date descending
                allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                return (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allEvents.map((event: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border-l-4 border-purple-400">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm text-slate-900">{event.description}</p>
                            {event.amount && (
                              <p className="text-xs text-green-600 font-bold">{formatCurrency(event.amount)}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              event.type === 'create' ? 'bg-green-100 text-green-700' :
                              event.type === 'payment' ? 'bg-blue-100 text-blue-700' :
                              event.type === 'pending' ? 'bg-red-100 text-red-700' :
                              event.type === 'update' ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {event.type}
                            </span>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(event.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              {/* Summary */}
              <div className="mt-4 bg-slate-900 text-white p-4 rounded-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-lg font-black">{formatCurrency(auditRecord.record.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Paid</p>
                    <p className="text-lg font-black text-green-400">{formatCurrency(auditRecord.record.paid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">{auditRecord.type === 'purchase' ? 'Balance' : 'Due'}</p>
                    <p className="text-lg font-black text-red-400">{formatCurrency(auditRecord.type === 'purchase' ? (auditRecord.record as Purchase).balance : (auditRecord.record as Sale).due)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t flex gap-3 shrink-0">
              <button onClick={() => { setShowAuditModal(false); setAuditRecord(null); }} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold">Close</button>
              <button 
                onClick={() => {
                  if (!auditRecord?.record) return;
                  const isPurchase = auditRecord.type === 'purchase';
                  const record = auditRecord.record;
                  const history = (record as any).history || [];
                  const payments = (record as any).payments || [];
                  const dueOrBalance = isPurchase ? (record as Purchase).balance : (record as Sale).due;
                  const partyName = isPurchase ? (record as Purchase).supplierName : (record as Sale).customerName;
                  const recordId = isPurchase ? ((record as Purchase).purchaseNumber || record.id.slice(0, 8)) : record.id.slice(0, 8);
                  
                  // Build ALL events
                  const allEvents: any[] = [];
                  
                  allEvents.push({
                    type: 'create',
                    description: `${isPurchase ? 'Purchase' : 'Sale'} created - ${record.items?.length || 0} items`,
                    date: record.createdAt || record.date,
                    amount: record.total,
                  });
                  
                  if ((record.paid || 0) > 0) {
                    const totalFromPayments = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                    const initialPayment = (record.paid || 0) - totalFromPayments;
                    if (initialPayment > 0) {
                      allEvents.push({
                        type: 'payment',
                        description: `Initial payment: ${formatCurrency(initialPayment)}`,
                        date: record.createdAt || record.date,
                        amount: initialPayment,
                      });
                    }
                  }
                  
                  payments.forEach((p: any) => {
                    allEvents.push({
                      type: 'payment',
                      description: `${isPurchase ? 'Payment made' : 'Payment received'}: ${formatCurrency(p.amount)} via ${p.paymentMethod || 'Cash'}`,
                      date: p.createdAt || record.updatedAt,
                      amount: p.amount,
                    });
                  });
                  
                  history.forEach((h: any) => {
                    allEvents.push({ type: h.action, description: h.description, date: h.createdAt, amount: h.amount });
                  });
                  
                  if (dueOrBalance > 0) {
                    allEvents.push({
                      type: 'pending',
                      description: `Pending: ${formatCurrency(dueOrBalance)}`,
                      date: new Date().toISOString(),
                      amount: dueOrBalance,
                    });
                  }
                  
                  allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html><head><title>Audit Trail</title>
                      <style>
                        body { font-family: monospace; font-size: 12px; width: 280px; padding: 10px; }
                        .center { text-align: center; } .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 8px 0; }
                        .row { display: flex; justify-content: space-between; margin: 4px 0; }
                        .header { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
                        .event { margin: 6px 0; padding: 4px 0; border-bottom: 1px dotted #ccc; }
                        .event-type { font-size: 10px; font-weight: bold; }
                        .event-date { font-size: 9px; color: #666; }
                      </style></head>
                      <body>
                        <div class="center bold header">AUDIT TRAIL</div>
                        <div class="divider"></div>
                        <div class="row"><span>Type:</span><span>${auditRecord.type.toUpperCase()}</span></div>
                        <div class="row"><span>ID:</span><span>#${recordId.toUpperCase()}</span></div>
                        <div class="row"><span>${isPurchase ? 'Supplier' : 'Customer'}:</span><span>${partyName}</span></div>
                        <div class="row"><span>Date:</span><span>${new Date(record.date).toLocaleDateString()}</span></div>
                        <div class="divider"></div>
                        <div class="center bold">HISTORY (${allEvents.length})</div>
                        <div class="divider"></div>
                        ${allEvents.map((e: any) => `
                          <div class="event">
                            <div class="row">
                              <span class="event-type">[${e.type.toUpperCase()}]</span>
                              <span class="bold">${e.amount ? formatCurrency(e.amount) : ''}</span>
                            </div>
                            <div>${e.description}</div>
                            <div class="event-date">${new Date(e.date).toLocaleString()}</div>
                          </div>
                        `).join('')}
                        <div class="divider"></div>
                        <div class="row bold"><span>Total:</span><span>${formatCurrency(record.total)}</span></div>
                        <div class="row"><span>Paid:</span><span>${formatCurrency(record.paid || 0)}</span></div>
                        <div class="row"><span>${isPurchase ? 'Balance' : 'Due'}:</span><span>${formatCurrency(dueOrBalance)}</span></div>
                        <div class="divider"></div>
                        <div class="center" style="font-size:10px">${new Date().toLocaleString()}</div>
                      </body></html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" /> Thermal
              </button>
              <button 
                onClick={() => {
                  if (!auditRecord?.record) return;
                  const isPurchase = auditRecord.type === 'purchase';
                  const record = auditRecord.record;
                  const history = (record as any).history || [];
                  const payments = (record as any).payments || [];
                  const dueOrBalance = isPurchase ? (record as Purchase).balance : (record as Sale).due;
                  const partyName = isPurchase ? (record as Purchase).supplierName : (record as Sale).customerName;
                  const recordId = isPurchase ? ((record as Purchase).purchaseNumber || record.id.slice(0, 8)) : record.id.slice(0, 8);
                  
                  // Build ALL events
                  const allEvents: any[] = [];
                  
                  allEvents.push({
                    type: 'create',
                    description: `${isPurchase ? 'Purchase' : 'Sale'} created - ${record.items?.length || 0} items`,
                    date: record.createdAt || record.date,
                    amount: record.total,
                  });
                  
                  if ((record.paid || 0) > 0) {
                    const totalFromPayments = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                    const initialPayment = (record.paid || 0) - totalFromPayments;
                    if (initialPayment > 0) {
                      allEvents.push({
                        type: 'payment',
                        description: `Initial payment: ${formatCurrency(initialPayment)}`,
                        date: record.createdAt || record.date,
                        amount: initialPayment,
                      });
                    }
                  }
                  
                  payments.forEach((p: any) => {
                    allEvents.push({
                      type: 'payment',
                      description: `${isPurchase ? 'Payment made' : 'Payment received'}: ${formatCurrency(p.amount)} via ${p.paymentMethod || 'Cash'}`,
                      date: p.createdAt || record.updatedAt,
                      amount: p.amount,
                    });
                  });
                  
                  history.forEach((h: any) => {
                    allEvents.push({ type: h.action, description: h.description, date: h.createdAt, amount: h.amount });
                  });
                  
                  if (dueOrBalance > 0) {
                    allEvents.push({
                      type: 'pending',
                      description: `Pending: ${formatCurrency(dueOrBalance)}`,
                      date: new Date().toISOString(),
                      amount: dueOrBalance,
                    });
                  }
                  
                  allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html><head><title>Audit Trail</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                        h1 { color: #1e293b; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
                        h2 { color: #475569; margin-top: 24px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
                        .info-item { padding: 10px; background: #f1f5f9; border-radius: 8px; }
                        .info-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
                        .info-value { font-weight: bold; }
                        .history-item { padding: 12px; border-left: 4px solid #8b5cf6; margin: 10px 0; background: #fafafa; border-radius: 0 8px 8px 0; }
                        .history-type { font-size: 12px; padding: 2px 8px; border-radius: 12px; display: inline-block; font-weight: bold; }
                        .type-create { background: #dcfce7; color: #166534; }
                        .type-payment { background: #dbeafe; color: #1e40af; }
                        .type-pending { background: #fee2e2; color: #991b1b; }
                        .type-update { background: #fed7aa; color: #9a3412; }
                        .history-desc { margin-top: 8px; font-size: 14px; }
                        .history-amount { font-weight: bold; color: #059669; }
                        .history-date { font-size: 12px; color: #64748b; margin-top: 4px; }
                        .summary { display: flex; gap: 20px; margin-top: 20px; padding: 20px; background: #1e293b; color: white; border-radius: 12px; }
                        .summary-item { text-align: center; flex: 1; }
                        .summary-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; }
                        .summary-value { font-size: 24px; font-weight: bold; margin-top: 4px; }
                      </style></head>
                      <body>
                        <h1>📋 Audit Trail Report</h1>
                        <div class="info-grid">
                          <div class="info-item">
                            <div class="info-label">Record Type</div>
                            <div class="info-value">${auditRecord.type.toUpperCase()}</div>
                          </div>
                          <div class="info-item">
                            <div class="info-label">ID</div>
                            <div class="info-value">#${recordId.toUpperCase()}</div>
                          </div>
                          <div class="info-item">
                            <div class="info-label">${isPurchase ? 'Supplier' : 'Customer'}</div>
                            <div class="info-value">${partyName}</div>
                          </div>
                          <div class="info-item">
                            <div class="info-label">Date</div>
                            <div class="info-value">${new Date(record.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <h2>📊 History Timeline (${allEvents.length} events)</h2>
                        ${allEvents.map((e: any) => `
                          <div class="history-item">
                            <span class="history-type type-${e.type}">${e.type.toUpperCase()}</span>
                            <div class="history-desc">
                              ${e.description}
                              ${e.amount ? `<span class="history-amount"> - ${formatCurrency(e.amount)}</span>` : ''}
                            </div>
                            <div class="history-date">📅 ${new Date(e.date).toLocaleString()}</div>
                          </div>
                        `).join('')}
                        
                        <div class="summary">
                          <div class="summary-item">
                            <div class="summary-label">TOTAL</div>
                            <div class="summary-value">${formatCurrency(record.total)}</div>
                          </div>
                          <div class="summary-item">
                            <div class="summary-label">PAID</div>
                            <div class="summary-value" style="color:#4ade80">${formatCurrency(record.paid || 0)}</div>
                          </div>
                          <div class="summary-item">
                            <div class="summary-label">${isPurchase ? 'BALANCE' : 'DUE'}</div>
                            <div class="summary-value" style="color:#f87171">${formatCurrency(dueOrBalance)}</div>
                          </div>
                        </div>
                        
                        <p style="text-align:center;color:#94a3b8;margin-top:20px">Generated on ${new Date().toLocaleString()}</p>
                      </body></html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default People;
