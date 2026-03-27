'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Supplier, Purchase, PurchaseItem } from '@/types';
import { Search, Plus, Trash2, ShoppingCart, Package, X, Minus, CreditCard, Building2, ChevronRight, Check, Pencil, Banknote, Calculator, Filter, Tag, Image as ImageIcon, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { formatCurrency, CURRENCY_SYMBOL } from '@/contexts/LanguageContext';
import PrintReceipt from '@/components/dokan/PrintReceipt';
import { toast } from '@/hooks/use-toast';
import { ProductImage, ImagePreview } from '@/components/ui/image-preview';

interface Props {
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeletePurchase: (id: string) => void;
  onUpdatePurchase?: (id: string, purchase: Partial<Purchase>, auditLog?: any) => void;
  currentUserRole?: string;
  currentUserPermissions?: Record<string, boolean>;
}

const Purchases: React.FC<Props> = ({ products, suppliers, purchases, onAddPurchase, onDeletePurchase, onUpdatePurchase, currentUserRole, currentUserPermissions }) => {
  // Permission checks - ONLY Master Admin has full access, all others need explicit permissions
  const isMasterAdmin = currentUserRole === 'Master Admin';
  const canCreate = isMasterAdmin || currentUserPermissions?.purchases_create === true;
  const canEdit = isMasterAdmin || currentUserPermissions?.purchases_edit === true;
  const canDelete = isMasterAdmin || currentUserPermissions?.purchases_delete === true;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [supplierSearch, setSupplierSearch] = useState('');
  
  // Separate dropdown states for each location
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const [isCheckoutDropdownOpen, setIsCheckoutDropdownOpen] = useState(false);
  
  // UI States
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Print dialog state
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<Purchase | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.totalPrice || 0), 0), [cart]);
  
  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  }, [subtotal, discountValue, discountType]);

  const grandTotal = Math.max(0, subtotal - calculatedDiscount);
  const itemCount = cart.reduce((a, b) => a + b.quantity, 0);

  const filteredSuppliers = useMemo(() => suppliers.filter(s => 
    (s.name && s.name.toLowerCase().includes(supplierSearch.toLowerCase())) || 
    (s.phone && s.phone.includes(supplierSearch)) ||
    (s.contact && s.contact.includes(supplierSearch))
  ), [suppliers, supplierSearch]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  }, [products, searchTerm, selectedCategory]);
  
  // Get unique categories from products
  const productCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const selectedSupplier = useMemo(() => 
    suppliers.find(s => s.id === selectedSupplierId), 
    [suppliers, selectedSupplierId]
  );

  const addToCart = useCallback((product: Product, qty: number = 1) => {
    if (!product || !product.id) return;
    
    const productName = product.name || 'Unknown Product';
    const unitPrice = product.purchasePrice || 0;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty <= 0) return prev.filter(i => i.productId !== product.id);
        return prev.map(item => 
          item.productId === product.id ? { 
            ...item, 
            quantity: newQty, 
            totalPrice: newQty * (item.unitPrice || unitPrice)
          } : item
        );
      }
      if (qty <= 0) return prev;
      return [...prev, {
        productId: product.id,
        productName: productName,
        sku: product.sku || '',
        quantity: 1,
        unitPrice: unitPrice,
        discount: 0,
        totalPrice: unitPrice,
        batchNumber: product.batchNumber,
        expiryDate: product.expiryDate
      }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.productId !== productId));
    } else {
      setCart(prev => prev.map(i => 
        i.productId === productId ? { ...i, quantity: qty, totalPrice: qty * (i.unitPrice || 0) } : i
      ));
    }
  }, []);

  const updatePrice = useCallback((productId: string, newPrice: number) => {
    setCart(prev => prev.map(i => 
      i.productId === productId ? { ...i, unitPrice: newPrice, totalPrice: i.quantity * newPrice } : i
    ));
  }, []);

  const handleComplete = useCallback(() => {
    // Validation: Require supplier selection
    if (!selectedSupplierId || !selectedSupplier) {
      toast({
        title: 'Supplier Required',
        description: 'Please select a supplier before completing the purchase.',
        variant: 'destructive',
      });
      return;
    }

    // Validation: Require items in cart
    if (cart.length === 0) {
      toast({
        title: 'Cart Empty',
        description: 'Please add items to the cart before completing the purchase.',
        variant: 'destructive',
      });
      return;
    }

    const newPurchase: Purchase = {
      id: `temp-${Date.now()}`,
      date: new Date(),
      purchaseNumber: `PO-${Date.now()}`,
      supplierId: selectedSupplierId,
      supplierName: selectedSupplier.name,
      items: cart,
      subtotal,
      discount: calculatedDiscount,
      taxAmount: 0,
      shippingCost: 0,
      total: grandTotal,
      paid: amountPaid,
      balance: Math.max(0, grandTotal - amountPaid),
      paymentStatus: amountPaid >= grandTotal ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending',
      status: 'Received',
      payments: amountPaid > 0 ? [{
        amount: amountPaid,
        paymentMethod: 'Cash',
        createdAt: new Date()
      }] : []
    };
    
    onAddPurchase(newPurchase);
    
    // Show purchase complete
    setPurchaseComplete(true);
    setLastPurchase(newPurchase);
    setShowPrintDialog(true);
    
    // Reset after delay
    setTimeout(() => {
      setCart([]);
      setAmountPaid(0);
      setDiscountValue(0);
      setSelectedSupplierId('');
      setSupplierSearch('');
      setShowCheckout(false);
      setShowMobileCart(false);
      setPurchaseComplete(false);
    }, 1500);
  }, [cart, subtotal, calculatedDiscount, grandTotal, amountPaid, selectedSupplierId, selectedSupplier, onAddPurchase]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => {
      setIsCartDropdownOpen(false);
      setIsCheckoutDropdownOpen(false);
    };
    if (isCartDropdownOpen || isCheckoutDropdownOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isCartDropdownOpen, isCheckoutDropdownOpen]);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
      {/* Products Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search Header */}
        <div className="p-3 sm:p-4 bg-white border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-teal-500 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter Dropdown */}
          {productCategories.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%207l3%203%203-3%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat pr-10"
              >
                <option value="all">All Categories ({products.length})</option>
                {productCategories.map(cat => {
                  const count = products.filter(p => p.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Package className="w-16 h-16 text-slate-200" />
              <p className="font-medium text-slate-400 mt-4">No products found</p>
              <p className="text-slate-300 text-sm mt-1">Try a different search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(i => i.productId === product.id);
                const displayName = product.name || 'Unknown Product';
                const displayPrice = product.purchasePrice || 0;
                const productImage = product.image || product.imageUrl;

                return (
                  <div key={product.id} className={`relative bg-white p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[140px] sm:min-h-[160px] ${inCart ? 'border-teal-500 shadow-md bg-teal-50/50' : 'border-slate-100 hover:border-teal-200 hover:shadow-lg'}`}>
                    {/* Product Image with Click-to-Preview */}
                    <ProductImage 
                      product={product} 
                      size="lg" 
                      className="w-full h-16 sm:h-20 rounded-xl mb-2 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight">{displayName}</h4>
                        {inCart && (
                          <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{inCart.quantity}</span>
                        )}
                      </div>
                      {/* Category Label */}
                      {product.category && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-medium mt-1">
                          <Tag className="w-2.5 h-2.5" />
                          {product.category}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-bold text-teal-600">{formatCurrency(displayPrice)}</p>
                        {product.stock !== undefined && (
                          <p className="text-[10px] text-slate-400">Stock: {product.stock}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      {inCart ? (
                        <div className="flex items-center justify-between bg-white rounded-xl p-1 shadow-sm border">
                          <button onClick={() => updateQty(product.id, inCart.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg font-bold active:scale-90 text-sm">−</button>
                          <span className="text-sm font-bold text-teal-600">{inCart.quantity}</span>
                          <button onClick={() => updateQty(product.id, inCart.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-teal-600 text-white rounded-lg font-bold active:scale-90 text-sm">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-full py-2 bg-slate-100 hover:bg-teal-600 text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Panel */}
      <div className="hidden lg:flex w-[380px] xl:w-[420px] border-l border-slate-200 flex-col bg-white shadow-xl">
        {/* Supplier Section */}
        <div className="p-3 border-b bg-slate-50 shrink-0 relative">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Supplier</span>
            <span className="text-red-500 text-xs">*</span>
            {!selectedSupplierId && cart.length > 0 && (
              <span className="text-xs text-amber-600 ml-auto flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Required
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Select supplier..."
                className={`w-full pl-9 pr-3 py-2.5 bg-white border-2 rounded-xl text-sm outline-none transition-all ${!selectedSupplierId && cart.length > 0 ? 'border-amber-300 focus:border-amber-500' : 'border-slate-200 focus:border-teal-500'}`}
                value={supplierSearch}
                onFocus={(e) => { e.stopPropagation(); setIsCartDropdownOpen(true); }}
                onChange={(e) => { setSupplierSearch(e.target.value); if (selectedSupplierId) setSelectedSupplierId(''); setIsCartDropdownOpen(true); }}
                onClick={(e) => e.stopPropagation()}
              />
              {selectedSupplier && (
                <button onClick={() => { setSelectedSupplierId(''); setSupplierSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          {isCartDropdownOpen && filteredSuppliers.length > 0 && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-white border rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto">
              {filteredSuppliers.slice(0, 6).map(s => (
                <button key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSupplierId(s.id); setSupplierSearch(s.name); setIsCartDropdownOpen(false); }} className="w-full p-3 text-left hover:bg-teal-50 border-b last:border-b-0">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.phone || s.contact || 'No contact'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-2 space-y-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Truck className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium text-slate-400">Cart is empty</p>
              <p className="text-slate-300 text-xs mt-1">Tap products to add</p>
            </div>
          ) : (
            cart.map(item => {
              const product = products.find(p => p.id === item.productId);
              const productImage = product?.image || product?.imageUrl;
              return (
              <div key={item.productId} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                  {productImage ? (
                    <img src={productImage} alt={item.productName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-slate-800 text-sm">{item.productName}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(item.unitPrice || 0)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition">−</button>
                  <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 bg-teal-600 text-white flex items-center justify-center rounded-lg font-bold text-sm hover:bg-teal-700 transition">+</button>
                </div>
                <p className="font-bold w-14 text-right text-sm">{formatCurrency(item.totalPrice || 0)}</p>
                <button onClick={() => updateQty(item.productId, 0)} className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );})
          )}
        </div>

        {/* Totals Section */}
        <div className="shrink-0 bg-white border-t">
          <div className="px-3 py-2 bg-teal-600 text-white flex items-center justify-between">
            <span className="text-teal-100 text-xs">Items: <b className="text-white">{itemCount}</b></span>
            <span className="text-xl font-black">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="px-3 py-2 bg-slate-50 flex items-center gap-2">
            <span className="text-xs text-slate-500">Disc:</span>
            <div className="flex bg-slate-200 rounded text-xs">
              <button onClick={() => setDiscountType('fixed')} className={`px-2 py-1 rounded-l transition ${discountType === 'fixed' ? 'bg-white text-teal-600 font-bold shadow' : 'text-slate-400'}`}>{CURRENCY_SYMBOL}</button>
              <button onClick={() => setDiscountType('percent')} className={`px-2 py-1 rounded-r transition ${discountType === 'percent' ? 'bg-white text-teal-600 font-bold shadow' : 'text-slate-400'}`}>%</button>
            </div>
            <input type="number" placeholder="0" className="w-14 p-1.5 bg-white border rounded text-center text-sm font-bold outline-none focus:border-teal-500" value={discountValue || ''} onChange={(e) => setDiscountValue(discountType === 'percent' ? Math.min(100, Number(e.target.value)) : Number(e.target.value))} />
            {calculatedDiscount > 0 && <span className="text-xs text-green-600 font-medium">-{formatCurrency(calculatedDiscount)}</span>}
          </div>
          <div className="p-2">
            <button onClick={() => setShowCheckout(true)} disabled={cart.length === 0} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-[0.98]">
              <CreditCard className="w-4 h-4 inline mr-2" /> Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden bg-white border-t p-3 shrink-0 safe-area-pb">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowMobileCart(true)} className="flex items-center gap-3 active:scale-95 transition">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-slate-600" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{itemCount}</span>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-500">{itemCount} items</p>
              <p className="font-bold">{formatCurrency(grandTotal)}</p>
            </div>
          </button>
          <button onClick={() => setShowCheckout(true)} disabled={cart.length === 0} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:bg-slate-300 transition-all active:scale-95">
            Checkout <ChevronRight className="w-4 h-4 inline" />
          </button>
        </div>
      </div>

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileCart(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-slate-50">
              <h2 className="text-lg font-bold">Purchase Cart</h2>
              <button onClick={() => setShowMobileCart(false)} className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Supplier Section */}
            <div className="p-3 border-b bg-slate-50 shrink-0 relative">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Supplier</span>
                <span className="text-red-500 text-xs">*</span>
                {!selectedSupplierId && cart.length > 0 && (
                  <span className="text-xs text-amber-600 ml-auto flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Required
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Select supplier..."
                    className={`w-full pl-9 pr-3 py-3 bg-white border-2 rounded-xl text-sm outline-none transition-all ${!selectedSupplierId && cart.length > 0 ? 'border-amber-300 focus:border-amber-500' : 'border-slate-200 focus:border-teal-500'}`}
                    value={supplierSearch}
                    onFocus={(e) => { e.stopPropagation(); setIsCartDropdownOpen(true); }}
                    onChange={(e) => { setSupplierSearch(e.target.value); setIsCartDropdownOpen(true); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {selectedSupplier && (
                    <button onClick={() => { setSelectedSupplierId(''); setSupplierSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {isCartDropdownOpen && filteredSuppliers.length > 0 && (
                <div className="absolute top-full left-3 right-3 mt-1 bg-white border rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto">
                  {filteredSuppliers.slice(0, 6).map(s => (
                    <button key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSupplierId(s.id); setSupplierSearch(s.name); setIsCartDropdownOpen(false); }} className="w-full p-3 text-left hover:bg-teal-50 border-b last:border-b-0">
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.phone || s.contact || 'No contact'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <Truck className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="font-medium text-slate-400">Cart is empty</p>
                  <p className="text-slate-300 text-sm mt-1">Add products to continue</p>
                </div>
              ) : (
                cart.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  const productImage = product?.image || product?.imageUrl;
                  return (
                  <div key={item.productId} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                      {productImage ? (
                        <img src={productImage} alt={item.productName || ''} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-slate-800">{item.productName}</p>
                      <p className="text-sm text-slate-400">{formatCurrency(item.unitPrice || 0)} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center rounded-lg font-bold bg-slate-100 text-slate-600 active:scale-90">−</button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-9 h-9 bg-teal-600 text-white flex items-center justify-center rounded-lg font-bold active:scale-90">+</button>
                    </div>
                    <p className="font-bold w-16 text-right">{formatCurrency(item.totalPrice || 0)}</p>
                    <button onClick={() => updateQty(item.productId, 0)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )})
              )}
            </div>
            
            {/* Totals */}
            <div className="shrink-0 bg-white border-t p-4 safe-area-pb">
              {/* Discount */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500 font-medium">Discount:</span>
                <div className="flex bg-slate-200 rounded-lg text-xs overflow-hidden">
                  <button onClick={() => setDiscountType('fixed')} className={`px-3 py-1.5 transition ${discountType === 'fixed' ? 'bg-white text-teal-600 font-bold shadow' : 'text-slate-400'}`}>{CURRENCY_SYMBOL}</button>
                  <button onClick={() => setDiscountType('percent')} className={`px-3 py-1.5 transition ${discountType === 'percent' ? 'bg-white text-teal-600 font-bold shadow' : 'text-slate-400'}`}>%</button>
                </div>
                <input type="number" placeholder="0" className="flex-1 p-2 bg-slate-50 border rounded-lg text-center font-bold" value={discountValue || ''} onChange={(e) => setDiscountValue(discountType === 'percent' ? Math.min(100, Number(e.target.value)) : Number(e.target.value))} />
              </div>
              
              <div className="flex justify-between mb-4 text-lg">
                <span className="font-bold text-slate-600">Total:</span>
                <span className="font-bold text-teal-600 text-xl">{formatCurrency(grandTotal)}</span>
              </div>
              <button onClick={() => { setShowMobileCart(false); setShowCheckout(true); }} disabled={cart.length === 0} className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.98] transition">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Checkout Slide-over */}
      {showCheckout && (
        <div className="hidden lg:flex fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCheckout(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-slate-50">
              <h2 className="text-xl font-bold">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Supplier Selection with Search */}
              <div className="p-4 border-b bg-slate-50 relative">
                <div className="flex items-center gap-1 mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase">Supplier</p>
                  <span className="text-red-500 text-xs">*</span>
                  {!selectedSupplierId && (
                    <span className="text-xs text-amber-600 ml-auto flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Required to complete
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search or select supplier..."
                    className={`w-full pl-10 pr-10 py-3 bg-white border-2 rounded-xl text-sm outline-none transition-all ${!selectedSupplierId ? 'border-amber-300 focus:border-amber-500' : 'focus:border-teal-500'}`}
                    value={supplierSearch}
                    onFocus={(e) => { e.stopPropagation(); setIsCheckoutDropdownOpen(true); }}
                    onChange={(e) => { setSupplierSearch(e.target.value); if (selectedSupplierId) setSelectedSupplierId(''); setIsCheckoutDropdownOpen(true); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {selectedSupplier && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSupplierId(''); setSupplierSearch(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Supplier Dropdown */}
                {isCheckoutDropdownOpen && (
                  <div
                    className="absolute top-full left-4 right-4 mt-1 bg-white border-2 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.slice(0, 8).map(s => (
                        <button
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplierId(s.id);
                            setSupplierSearch(s.name);
                            setIsCheckoutDropdownOpen(false);
                          }}
                          className={`w-full p-3 text-left hover:bg-teal-50 border-b last:border-b-0 transition flex items-center gap-3 ${selectedSupplierId === s.id ? 'bg-teal-50' : ''}`}
                        >
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.phone || s.contact || 'No contact'}</p>
                          </div>
                          {selectedSupplierId === s.id && (
                            <Check className="w-5 h-5 text-green-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-sm">
                        No suppliers found
                      </div>
                    )}
                  </div>
                )}
                {/* Selected Supplier Info */}
                {selectedSupplier && (
                  <div className="mt-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{selectedSupplier.name}</p>
                        <p className="text-sm text-slate-500">{selectedSupplier.phone || selectedSupplier.contact || 'No contact'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items with Price Edit */}
              <div className="p-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase mb-3">Items ({itemCount})</h3>
                <div className="space-y-2">
                  {cart.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                    <div key={item.productId} className="bg-gradient-to-r from-slate-50 to-white p-3 rounded-xl border border-slate-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <ProductImage product={product || { name: item.productName || 'Unknown' }} size="sm" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-800">{item.productName}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(item.unitPrice || 0)} × {item.quantity}</p>
                        </div>
                        <p className="font-bold text-teal-600">{formatCurrency(item.totalPrice || 0)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {/* Price Edit */}
                        <div className="flex items-center gap-1">
                          {editingPriceId === item.productId ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-400">{CURRENCY_SYMBOL}</span>
                              <input 
                                type="number" 
                                value={tempPrice} 
                                onChange={(e) => setTempPrice(e.target.value)}
                                className="w-20 h-7 text-center border-2 border-teal-500 rounded-lg font-bold text-sm focus:outline-none"
                                autoFocus
                              />
                              <button 
                                onClick={() => { updatePrice(item.productId, parseFloat(tempPrice) || 0); setEditingPriceId(null); }}
                                className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => setEditingPriceId(null)}
                                className="w-7 h-7 bg-red-100 text-red-500 rounded-lg flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { setEditingPriceId(item.productId); setTempPrice(String(item.unitPrice || 0)); }}
                              className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-medium transition"
                            >
                              <Pencil className="w-3 h-3" />
                              {formatCurrency(item.unitPrice || 0)}
                            </button>
                          )}
                        </div>
                        {/* Quantity */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => updateQty(item.productId, item.quantity - 1)} 
                            className="w-7 h-7 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-lg flex items-center justify-center transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 0)} 
                            className="w-10 h-7 text-center border rounded-lg font-bold text-sm focus:border-teal-500 outline-none" 
                          />
                          <button 
                            onClick={() => updateQty(item.productId, item.quantity + 1)} 
                            className="w-7 h-7 bg-teal-600 text-white rounded-lg flex items-center justify-center hover:bg-teal-700 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              </div>

              {/* Discount */}
              <div className="px-4 pb-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Discount</p>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setDiscountType('fixed')} className={`flex-1 py-2.5 rounded-lg font-bold transition text-sm ${discountType === 'fixed' ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'bg-white border hover:bg-slate-50'}`}>{CURRENCY_SYMBOL} Fixed</button>
                    <button onClick={() => setDiscountType('percent')} className={`flex-1 py-2.5 rounded-lg font-bold transition text-sm ${discountType === 'percent' ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'bg-white border hover:bg-slate-50'}`}>% Percent</button>
                  </div>
                  {discountType === 'fixed' ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{CURRENCY_SYMBOL}</span>
                      <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} placeholder="0.00" className="w-full p-3 pl-8 border-2 rounded-xl font-bold text-lg focus:border-teal-500 outline-none" />
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Math.min(100, Number(e.target.value)))} placeholder="0" max="100" className="w-full p-3 pr-8 border-2 rounded-xl font-bold text-lg focus:border-teal-500 outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="shrink-0 bg-white border-t">
              {/* Total & Amount Row */}
              <div className="p-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {calculatedDiscount > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-teal-100 line-through">{formatCurrency(subtotal)}</span>
                          <span className="text-[10px] bg-red-500/80 text-white px-1.5 py-0.5 rounded font-bold">
                            -{discountType === 'percent' ? `${discountValue}%` : formatCurrency(calculatedDiscount)}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-black text-white">{formatCurrency(grandTotal)}</p>
                          <div className="flex items-center gap-1 bg-green-500/20 text-green-200 px-2 py-0.5 rounded-full">
                            <span className="text-[10px]">✓</span>
                            <span className="text-[10px] font-bold">SAVE {formatCurrency(calculatedDiscount)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] text-teal-100 uppercase tracking-wider">Grand Total</p>
                        <p className="text-2xl font-black">{formatCurrency(grandTotal)}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                      <Banknote className="w-3.5 h-3.5 text-green-300" />
                      <input
                        type="number"
                        value={amountPaid || ''}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                        placeholder="0"
                        className="w-20 bg-transparent text-right text-xl font-black text-white outline-none placeholder:text-teal-200"
                      />
                    </div>
                    {amountPaid >= grandTotal && amountPaid > 0 ? (
                      <p className="text-[10px] text-green-200 mt-1">
                        ✓ Balance: {formatCurrency(amountPaid - grandTotal)}
                      </p>
                    ) : amountPaid > 0 ? (
                      <p className="text-[10px] text-amber-200 mt-1">
                        Due: {formatCurrency(grandTotal - amountPaid)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-teal-200 mt-1">Enter amount</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="px-3 py-2 bg-slate-50 border-b flex gap-1.5 flex-wrap">
                <button onClick={() => setAmountPaid(grandTotal)} className="px-2.5 py-1 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">Exact</button>
                <button onClick={() => setAmountPaid(Math.ceil(grandTotal / 100) * 100)} className="px-2.5 py-1 text-xs font-bold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition">Round</button>
                {[100, 200, 500, 1000].map(val => (
                  <button key={val} onClick={() => setAmountPaid(val)} className="px-2.5 py-1 text-xs font-bold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition">{val}</button>
                ))}
              </div>

              {/* Complete Button */}
              <div className="p-3 space-y-2">
                {/* Supplier Warning */}
                {cart.length > 0 && !selectedSupplierId && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Please select a supplier to complete purchase</span>
                  </div>
                )}
                <button
                  onClick={handleComplete}
                  disabled={cart.length === 0 || !selectedSupplierId}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    cart.length === 0 || !selectedSupplierId
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : amountPaid >= grandTotal && amountPaid > 0
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30'
                      : amountPaid > 0
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-teal-500/30'
                  }`}
                >
                  {amountPaid >= grandTotal && amountPaid > 0 ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete - Fully Paid
                    </>
                  ) : amountPaid > 0 ? (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Complete - Partial (Due: {formatCurrency(grandTotal - amountPaid)})
                    </>
                  ) : (
                    <>
                      <Truck className="w-5 h-5" />
                      Complete Purchase
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Checkout Full Screen */}
      {showCheckout && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between shrink-0 bg-slate-50">
            <h2 className="text-xl font-bold">Checkout</h2>
            <button onClick={() => setShowCheckout(false)} className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Supplier Selection */}
            <div className="p-4 border-b bg-slate-50 relative">
              <div className="flex items-center gap-1 mb-2">
                <p className="text-xs text-slate-500 font-bold uppercase">Supplier</p>
                <span className="text-red-500 text-xs">*</span>
                {!selectedSupplierId && (
                  <span className="text-xs text-amber-600 ml-auto flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Required to complete
                  </span>
                )}
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search or select supplier..."
                  className={`w-full pl-10 pr-10 py-3.5 bg-white border-2 rounded-xl text-base outline-none transition-all ${!selectedSupplierId ? 'border-amber-300 focus:border-amber-500' : 'focus:border-teal-500'}`}
                  value={supplierSearch}
                  onFocus={(e) => { e.stopPropagation(); setIsCheckoutDropdownOpen(true); }}
                  onChange={(e) => { setSupplierSearch(e.target.value); if (selectedSupplierId) setSelectedSupplierId(''); setIsCheckoutDropdownOpen(true); }}
                  onClick={(e) => e.stopPropagation()}
                />
                {selectedSupplier && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedSupplierId(''); setSupplierSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition active:scale-90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isCheckoutDropdownOpen && (
                <div
                  className="absolute top-full left-4 right-4 mt-1 bg-white border-2 rounded-2xl shadow-2xl z-[100] max-h-72 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.slice(0, 8).map(s => (
                      <button
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupplierId(s.id);
                          setSupplierSearch(s.name);
                          setIsCheckoutDropdownOpen(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-teal-50 border-b last:border-b-0 transition flex items-center gap-3 ${selectedSupplierId === s.id ? 'bg-teal-50' : ''}`}
                      >
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.phone || s.contact || 'No contact'}</p>
                        </div>
                        {selectedSupplierId === s.id && <Check className="w-5 h-5 text-green-600 ml-auto" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-sm">No suppliers found</div>
                  )}
                </div>
              )}
              {selectedSupplier && !isCheckoutDropdownOpen && (
                <div className="mt-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{selectedSupplier.name}</p>
                      <p className="text-sm text-slate-500">{selectedSupplier.phone || selectedSupplier.contact || 'No contact'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="p-4">
              <h3 className="font-bold text-sm text-slate-500 uppercase mb-3">Items ({itemCount})</h3>
              <div className="space-y-2">
                {cart.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                  <div key={item.productId} className="bg-slate-50 p-3 rounded-xl border">
                    <div className="flex items-center gap-3 mb-2">
                      <ProductImage product={product || { name: item.productName || 'Unknown' }} size="sm" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.productName}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(item.unitPrice || 0)} × {item.quantity}</p>
                      </div>
                      <p className="font-bold text-teal-600">{formatCurrency(item.totalPrice || 0)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {editingPriceId === item.productId ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">{CURRENCY_SYMBOL}</span>
                            <input 
                              type="number" 
                              value={tempPrice} 
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-16 h-8 text-center border-2 border-teal-500 rounded-lg font-bold text-sm"
                              autoFocus
                            />
                            <button onClick={() => { updatePrice(item.productId, parseFloat(tempPrice) || 0); setEditingPriceId(null); }} className="w-8 h-8 bg-green-500 text-white rounded-lg"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingPriceId(null)} className="w-8 h-8 bg-red-100 text-red-500 rounded-lg"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingPriceId(item.productId); setTempPrice(String(item.unitPrice || 0)); }} className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-medium">
                            <Pencil className="w-3 h-3 inline mr-1" />{formatCurrency(item.unitPrice || 0)}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 bg-slate-200 rounded-lg"><Minus className="w-4 h-4" /></button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 bg-teal-600 text-white rounded-lg"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            </div>

            {/* Discount */}
            <div className="px-4 pb-4">
              <div className="bg-slate-50 p-4 rounded-xl border">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Discount</p>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setDiscountType('fixed')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${discountType === 'fixed' ? 'bg-teal-600 text-white' : 'bg-white border'}`}>{CURRENCY_SYMBOL} Fixed</button>
                  <button onClick={() => setDiscountType('percent')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${discountType === 'percent' ? 'bg-teal-600 text-white' : 'bg-white border'}`}>% Percent</button>
                </div>
                <input 
                  type="number" 
                  value={discountValue || ''} 
                  onChange={(e) => setDiscountValue(discountType === 'percent' ? Math.min(100, Number(e.target.value)) : Number(e.target.value))} 
                  placeholder={discountType === 'percent' ? '0%' : '0.00'} 
                  className="w-full p-3 border-2 rounded-xl font-bold text-lg focus:border-teal-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="shrink-0 bg-white border-t safe-area-pb">
            <div className="p-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-teal-100 uppercase">Total</p>
                  <p className="text-2xl font-black">{formatCurrency(grandTotal)}</p>
                </div>
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                  <Banknote className="w-4 h-4 text-green-300" />
                  <input
                    type="number"
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    placeholder="0"
                    className="w-24 bg-transparent text-right text-xl font-black text-white outline-none placeholder:text-teal-200"
                  />
                </div>
              </div>
              {amountPaid > 0 && (
                <p className={`text-xs mt-1 text-right ${amountPaid >= grandTotal ? 'text-green-200' : 'text-amber-200'}`}>
                  {amountPaid >= grandTotal ? `✓ Balance: ${formatCurrency(amountPaid - grandTotal)}` : `Due: ${formatCurrency(grandTotal - amountPaid)}`}
                </p>
              )}
            </div>
            <div className="px-3 py-2 flex gap-2 flex-wrap">
              <button onClick={() => setAmountPaid(grandTotal)} className="px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg">Exact</button>
              {[100, 200, 500, 1000].map(v => (
                <button key={v} onClick={() => setAmountPaid(v)} className="px-3 py-1.5 text-xs font-bold bg-slate-200 rounded-lg">{v}</button>
              ))}
            </div>
            <div className="p-3 space-y-2">
              {/* Supplier Warning */}
              {cart.length > 0 && !selectedSupplierId && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Please select a supplier to complete purchase</span>
                </div>
              )}
              <button
                onClick={handleComplete}
                disabled={cart.length === 0 || !selectedSupplierId}
                className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 bg-gradient-to-r from-teal-500 to-emerald-500 text-white active:scale-[0.98]"
              >
                <Truck className="w-5 h-5" />
                Complete Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Dialog */}
      <PrintReceipt
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        purchase={lastPurchase}
        type="purchase"
      />

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .safe-area-pb {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
};

export default Purchases;
