'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Product, Customer, Sale, SaleItem, AppSettings } from '@/types';
import { X, Camera, RotateCcw, Check, Minus, Plus, Trash2, Scan, ShoppingCart, CreditCard, UserCircle, User, Pencil, Banknote, AlertCircle, Phone } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { formatCurrency, CURRENCY_SYMBOL } from '@/contexts/LanguageContext';
import { ProductImage } from '@/components/ui/image-preview';

interface Props {
  products: Product[];
  customers: Customer[];
  settings?: AppSettings | null;
  onComplete: (sale: Sale) => void;
}

const ScannerPOS: React.FC<Props> = ({ products, customers, settings, onComplete }) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Customer search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Price edit states
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [scanPaused, setScanPaused] = useState(false);

  // UI state
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Check if walk-in customer is allowed
  const allowWalkInCustomer = settings?.allowWalkInCustomer !== false; // Default to true
  const isCustomerRequired = !allowWalkInCustomer;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.totalPrice || 0), 0), [cart]);
  
  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discountPercent) / 100;
    }
    return discountValue;
  }, [subtotal, discountType, discountPercent, discountValue]);
  
  const grandTotal = Math.max(0, subtotal - calculatedDiscount);
  const itemCount = cart.reduce((a, b) => a + b.quantity, 0);

  // Filtered customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const searchLower = customerSearch.toLowerCase().trim();
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(searchLower)) ||
      c.phone?.includes(customerSearch.trim()) ||
      c.phone?.replace(/\D/g, '').includes(customerSearch.trim().replace(/\D/g, ''))
    );
  }, [customers, customerSearch]);

  // Validate customer for checkout
  const canProceedToCheckout = useMemo(() => {
    if (isCustomerRequired && !selectedCustomerId) {
      return false;
    }
    return cart.length > 0;
  }, [isCustomerRequired, selectedCustomerId, cart.length]);

  // Selected customer
  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId), 
    [customers, selectedCustomerId]
  );

  // Get quantity
  const getQty = (id: string) => cart.find(i => i.productId === id)?.quantity || 0;

  // Add to cart with stock validation
  const addToCart = useCallback((product: Product) => {
    // Clear previous error
    setStockError(null);
    
    // Get current quantity in cart
    const currentQtyInCart = cart.find(i => i.productId === product.id)?.quantity || 0;
    
    // Check stock
    const availableStock = product.stock || 0;
    
    if (availableStock <= 0) {
      setStockError(`${product.name} is Out of Stock!`);
      return;
    }
    
    if (currentQtyInCart >= availableStock) {
      setStockError(`Only ${availableStock} ${product.name} available in stock!`);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id 
          ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * (i.unitPrice || 0) }
          : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name || 'Product',
        sku: product.sku || '',
        quantity: 1,
        unitPrice: product.salePrice || 0,
        discount: 0,
        taxAmount: 0,
        totalPrice: product.salePrice || 0,
        isReturned: false,
        returnedQty: 0
      }];
    });
  }, [cart]);

  // Update quantity with stock validation
  const updateQty = useCallback((id: string, qty: number) => {
    setStockError(null);
    
    // Get product stock
    const product = products.find(p => p.id === id);
    if (product && qty > (product.stock || 0)) {
      setStockError(`Only ${product.stock} ${product.name} available in stock!`);
      return;
    }
    
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.productId !== id));
    } else {
      setCart(prev => prev.map(i => 
        i.productId === id ? { ...i, quantity: qty, totalPrice: qty * (i.unitPrice || 0) } : i
      ));
    }
  }, [products]);

  // Update price
  const updatePrice = useCallback((productId: string, newPrice: number) => {
    setCart(prev => prev.map(i => 
      i.productId === productId ? { ...i, unitPrice: newPrice, totalPrice: i.quantity * newPrice } : i
    ));
  }, []);

  // Resume scanning
  const resumeScanning = useCallback(() => {
    setScanPaused(false);
    setLastScanned(null);
    lastScannedCodeRef.current = null;
  }, []);

  // Start scanner
  const startScanner = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        alert('No camera found!');
        return;
      }
      
      setShowStartButton(false);
      setScanPaused(false);
      
      await new Promise(r => setTimeout(r, 300));
      
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      
      const config = {
        fps: 30,
        qrbox: { width: 250, height: 250 }
      };
      
      const cameraId = devices[cameraIndex % devices.length].id;
      
      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          if (scanPaused || lastScannedCodeRef.current === decodedText) return;
          
          const product = products.find(p => 
            p.sku === decodedText || 
            p.barcode === decodedText || 
            p.id === decodedText
          );
          
          if (product) {
            lastScannedCodeRef.current = decodedText;
            setScanPaused(true);
            
            addToCart(product);
            setLastScanned(product);
            
            cooldownRef.current = setTimeout(() => {
              resumeScanning();
            }, 3000);
            
            if (navigator.vibrate) navigator.vibrate(100);
          }
        },
        () => {}
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error(err);
      alert('Could not start camera. Please allow camera permission.');
      setShowStartButton(true);
    }
  }, [products, addToCart, cameraIndex, scanPaused, resumeScanning]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setIsScanning(false);
    setShowStartButton(true);
    setScanPaused(false);
    lastScannedCodeRef.current = null;
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    await stopScanner();
    setCameraIndex(prev => prev + 1);
    setTimeout(() => startScanner(), 300);
  }, [stopScanner, startScanner]);

  // Complete sale
  const handleComplete = useCallback(() => {
    // Validate customer if required
    if (isCustomerRequired && !selectedCustomerId) {
      setCustomerError('Please select a customer to complete the sale');
      return;
    }

    const sale: Sale = {
      id: crypto.randomUUID(),
      invoiceNumber: '',
      date: new Date(),
      customerId: selectedCustomerId || null,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      items: cart,
      subtotal,
      itemDiscount: 0,
      cartDiscount: calculatedDiscount,
      taxAmount: 0,
      shippingCost: 0,
      total: grandTotal,
      paid: amountPaid,
      due: Math.max(0, grandTotal - amountPaid),
      changeAmount: 0,
      paymentMethod: 'Cash',
      paymentStatus: amountPaid >= grandTotal ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending',
      status: 'Completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onComplete(sale);
    setCart([]);
    setAmountPaid(0);
    setDiscountValue(0);
    setDiscountPercent(0);
    setSelectedCustomerId('');
    setCustomerSearch('');
    setShowCheckout(false);
    setCustomerError(null);
    setShowMobileCart(false);
    setLastScanned(null);
  }, [cart, subtotal, calculatedDiscount, grandTotal, amountPaid, selectedCustomerId, selectedCustomer, onComplete, isCustomerRequired]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setIsCustomerDropdownOpen(false);
    if (isCustomerDropdownOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isCustomerDropdownOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-900 overflow-hidden">
      {/* Scanner Area */}
      <div className="flex-1 relative flex flex-col min-h-[40vh] lg:min-h-full">
        {/* Scanner Header */}
        <div className="p-3 lg:p-4 bg-slate-800 flex items-center justify-between shrink-0">
          <h1 className="text-white font-bold text-base lg:text-lg flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Barcode Scanner
          </h1>
          {isScanning && (
            <button onClick={switchCamera} className="px-3 py-2 bg-slate-700 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-slate-600 transition">
              <RotateCcw className="w-4 h-4" /> Switch
            </button>
          )}
        </div>

        {/* Scanner View */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {/* Start Button */}
          {showStartButton && (
            <div className="text-center p-6 lg:p-8">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                <Scan className="w-10 h-10 lg:w-12 lg:h-12 text-blue-400" />
              </div>
              <p className="text-white text-lg lg:text-xl font-bold mb-2">Start Scanning</p>
              <p className="text-slate-400 text-sm mb-4 lg:mb-6">Click to enable camera</p>
              <button onClick={startScanner} className="px-6 lg:px-8 py-3 lg:py-4 bg-blue-600 text-white font-bold rounded-xl text-base lg:text-lg active:scale-95 transition hover:bg-blue-700">
                <Camera className="w-5 h-5 inline mr-2" /> Enable Camera
              </button>
            </div>
          )}

          {/* Scanner Container */}
          <div id="qr-reader" className={`w-full h-full ${showStartButton ? 'hidden' : ''}`} />

          {/* Scanning Status */}
          {isScanning && !scanPaused && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-2 rounded-full">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">Scanning...</span>
              </div>
            </div>
          )}
          
          {/* Paused Status */}
          {scanPaused && lastScanned && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-4 lg:p-6 max-w-sm w-full text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Added!</h3>
                <p className="text-slate-500 text-sm mb-1">{lastScanned.name}</p>
                <p className="text-xl font-bold text-green-600 mb-4">{formatCurrency(lastScanned.salePrice || 0)}</p>
                
                <div className="flex items-center justify-center gap-3 mb-4">
                  <button onClick={() => updateQty(lastScanned.id, getQty(lastScanned.id) - 1)} className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-lg font-bold hover:bg-slate-200 transition active:scale-90">−</button>
                  <span className="w-12 text-2xl font-bold">{getQty(lastScanned.id)}</span>
                  <button onClick={() => updateQty(lastScanned.id, getQty(lastScanned.id) + 1)} className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-lg font-bold hover:bg-blue-700 transition active:scale-90">+</button>
                </div>
                
                <button onClick={resumeScanning} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">Continue Scanning</button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Cart Summary Bar */}
        <div className="lg:hidden bg-slate-800 p-3 border-t border-slate-700 shrink-0 safe-area-pb">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg">{itemCount}</div>
              <div>
                <p className="text-slate-400 text-xs">Items in cart</p>
                <p className="text-white text-lg font-bold">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowMobileCart(true)} disabled={cart.length === 0} className="px-4 py-3 bg-slate-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 active:scale-95 transition">
                <ShoppingCart className="w-4 h-4" /> Cart
              </button>
              <button onClick={() => setShowCheckout(true)} disabled={cart.length === 0} className="px-4 py-3 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-95 transition hover:bg-green-700">Checkout</button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Side Panel */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-slate-800 flex-col border-l border-slate-700">
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Shopping Cart</h2>
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-bold">{itemCount} items</span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Stock Error Message */}
          {stockError && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              {stockError}
              <button onClick={() => setStockError(null)} className="ml-auto text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <ShoppingCart className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium">Cart is empty</p>
              <p className="text-slate-500 text-sm">Scan products to add</p>
            </div>
          ) : (
            cart.map(item => {
              const product = products.find(p => p.id === item.productId);
              return (
              <div key={item.productId} className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
                <ProductImage product={product || { name: item.productName || 'Unknown' }} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{item.productName}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(item.unitPrice || 0)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg font-bold bg-slate-600 text-white hover:bg-slate-500 transition">−</button>
                  <span className="w-7 text-center font-bold text-white">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg font-bold hover:bg-blue-700 transition">+</button>
                </div>
                <p className="font-bold w-14 text-right text-white">{formatCurrency(item.totalPrice || 0)}</p>
                <button onClick={() => updateQty(item.productId, 0)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );})
          )}
        </div>

        {/* Desktop Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 shrink-0">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400">Items:</span>
            <span className="text-white font-bold">{itemCount}</span>
          </div>
          <div className="flex justify-between mb-4 text-xl">
            <span className="text-white font-bold">Total:</span>
            <span className="text-blue-400 font-bold">{formatCurrency(grandTotal)}</span>
          </div>
          <button onClick={() => setShowCheckout(true)} disabled={cart.length === 0} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 text-lg hover:bg-green-700 transition active:scale-[0.98]">
            <CreditCard className="w-5 h-5 inline mr-2" /> Checkout
          </button>
        </div>
      </div>

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowMobileCart(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-slate-900 flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
              <h2 className="text-white font-bold text-lg">Cart Items</h2>
              <button onClick={() => setShowMobileCart(false)} className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Stock Error Message */}
              {stockError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {stockError}
                  <button onClick={() => setStockError(null)} className="ml-auto text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <ShoppingCart className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-slate-400 font-medium">Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-white">{item.productName}</p>
                      <p className="text-sm text-slate-400">{formatCurrency(item.unitPrice || 0)} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center rounded-lg font-bold bg-slate-700 text-white active:scale-90">−</button>
                      <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center rounded-lg font-bold active:scale-90">+</button>
                    </div>
                    <p className="font-bold w-16 text-right text-white">{formatCurrency(item.totalPrice || 0)}</p>
                    <button onClick={() => updateQty(item.productId, 0)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-700 shrink-0 safe-area-pb">
              <div className="flex justify-between mb-4">
                <span className="text-slate-400">Total:</span>
                <span className="text-white text-xl font-bold">{formatCurrency(grandTotal)}</span>
              </div>
              <button onClick={() => { setShowMobileCart(false); setShowCheckout(true); }} disabled={cart.length === 0} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.98] transition">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Checkout Slide-over */}
      {showCheckout && (
        <div className="hidden lg:flex fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCheckout(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-slate-50">
              <h2 className="text-xl font-bold">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Customer Selection with Search */}
              <div className="p-4 border-b bg-slate-50 relative">
                <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Customer</p>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search or select customer..." 
                    className="w-full pl-10 pr-10 py-3 bg-white border-2 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                    value={customerSearch}
                    onFocus={(e) => { e.stopPropagation(); setIsCustomerDropdownOpen(true); }}
                    onChange={(e) => { setCustomerSearch(e.target.value); if (selectedCustomerId) setSelectedCustomerId(''); setIsCustomerDropdownOpen(true); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {selectedCustomer && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(''); setCustomerSearch(''); }} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Customer Dropdown */}
                {isCustomerDropdownOpen && (
                  <div 
                    className="absolute top-full left-4 right-4 mt-1 bg-white border-2 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.slice(0, 8).map(c => (
                        <button 
                          key={c.id} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedCustomerId(c.id); 
                            setCustomerSearch(c.name); 
                            setIsCustomerDropdownOpen(false); 
                          }} 
                          className={`w-full p-3 text-left hover:bg-blue-50 border-b last:border-b-0 transition flex items-center gap-3 ${selectedCustomerId === c.id ? 'bg-blue-50' : ''}`}
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.phone || 'No phone'}</p>
                          </div>
                          {selectedCustomerId === c.id && (
                            <Check className="w-5 h-5 text-green-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-sm">
                        No customers found
                      </div>
                    )}
                    {/* Walk-in option */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedCustomerId(''); 
                        setCustomerSearch(''); 
                        setIsCustomerDropdownOpen(false); 
                      }} 
                      className="w-full p-3 text-left bg-slate-50 hover:bg-slate-100 border-t flex items-center gap-3 transition"
                    >
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-600">Walk-in Customer</p>
                        <p className="text-xs text-slate-400">No customer selected</p>
                      </div>
                    </button>
                  </div>
                )}
                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
                        <p className="text-sm text-slate-500">{selectedCustomer.phone || 'No phone'}</p>
                        {selectedCustomer.address && (
                          <p className="text-xs text-slate-400 mt-0.5">{selectedCustomer.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items with Price Edit */}
              <div className="p-4">
                <h3 className="font-bold text-sm text-slate-500 uppercase mb-3">Items ({itemCount})</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.productId} className="bg-gradient-to-r from-slate-50 to-white p-3 rounded-xl border border-slate-100 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm text-slate-800">{item.productName}</p>
                        <p className="font-bold text-blue-600">{formatCurrency(item.totalPrice || 0)}</p>
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
                                className="w-20 h-7 text-center border-2 border-blue-500 rounded-lg font-bold text-sm focus:outline-none"
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
                            className="w-10 h-7 text-center border rounded-lg font-bold text-sm focus:border-blue-500 outline-none" 
                          />
                          <button 
                            onClick={() => updateQty(item.productId, item.quantity + 1)} 
                            className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div className="px-4 pb-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Discount</p>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setDiscountType('fixed')} className={`flex-1 py-2.5 rounded-lg font-bold transition text-sm ${discountType === 'fixed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border hover:bg-slate-50'}`}>{CURRENCY_SYMBOL} Fixed</button>
                    <button onClick={() => setDiscountType('percent')} className={`flex-1 py-2.5 rounded-lg font-bold transition text-sm ${discountType === 'percent' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border hover:bg-slate-50'}`}>% Percent</button>
                  </div>
                  {discountType === 'fixed' ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{CURRENCY_SYMBOL}</span>
                      <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} placeholder="0.00" className="w-full p-3 pl-8 border-2 rounded-xl font-bold text-lg focus:border-blue-500 outline-none" />
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="number" value={discountPercent || ''} onChange={(e) => setDiscountPercent(Math.min(100, Number(e.target.value)))} placeholder="0" max="100" className="w-full p-3 pr-8 border-2 rounded-xl font-bold text-lg focus:border-blue-500 outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Section - Clean & Eye-Catching */}
            <div className="shrink-0 bg-white border-t-4 border-slate-100">
              {/* Animated Total Banner - Clickable to Fill Amount */}
              <div 
                className="relative overflow-hidden cursor-pointer group"
                onClick={() => setAmountPaid(grandTotal)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x"></div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                <div className="relative p-5 text-white text-center">
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Grand Total</p>
                  <p className="text-4xl font-black mt-1 drop-shadow-lg group-hover:scale-105 transition-transform">{formatCurrency(grandTotal)}</p>
                  {calculatedDiscount > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs line-through">{formatCurrency(subtotal)}</span>
                      <span className="bg-green-400/30 text-green-100 px-2 py-0.5 rounded-full text-xs font-bold">Save {formatCurrency(calculatedDiscount)}</span>
                    </div>
                  )}
                  <p className="text-white/60 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    👆 Click to set as received amount
                  </p>
                </div>
              </div>
              
              {/* Payment Area */}
              <div className="p-4 bg-slate-50">
                {/* Amount Input with Visual Feedback */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-green-600" />
                      Amount Received
                    </label>
                    {amountPaid > 0 && amountPaid < grandTotal && (
                      <span className="text-xs text-amber-600 font-bold animate-pulse">
                        Due: {formatCurrency(grandTotal - amountPaid)}
                      </span>
                    )}
                  </div>
                  
                  <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${amountPaid >= grandTotal && amountPaid > 0 ? 'ring-4 ring-green-400/50' : amountPaid > 0 ? 'ring-4 ring-amber-400/50' : ''}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center border-r">
                      <span className="text-xl font-black text-slate-500">{CURRENCY_SYMBOL}</span>
                    </div>
                    <input 
                      type="number" 
                      value={amountPaid || ''} 
                      onChange={(e) => setAmountPaid(Number(e.target.value))} 
                      placeholder="0" 
                      className="w-full p-4 pl-20 pr-4 bg-white border-2 border-slate-200 text-3xl font-black text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-300" 
                    />
                    {amountPaid >= grandTotal && amountPaid > 0 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce-in">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Payment Status Visual */}
                {amountPaid > 0 && (
                  <div className={`mb-4 p-4 rounded-xl transition-all duration-500 ${amountPaid >= grandTotal ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${amountPaid >= grandTotal ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}>
                        {amountPaid >= grandTotal ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <CreditCard className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold ${amountPaid >= grandTotal ? 'text-green-700' : 'text-amber-700'}`}>
                          {amountPaid >= grandTotal ? 'Payment Complete!' : 'Partial Payment'}
                        </p>
                        {amountPaid > grandTotal && (
                          <p className="text-sm text-green-600">Change: <span className="font-bold">{formatCurrency(amountPaid - grandTotal)}</span></p>
                        )}
                        {amountPaid < grandTotal && (
                          <p className="text-sm text-amber-600">Remaining: <span className="font-bold">{formatCurrency(grandTotal - amountPaid)}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Complete Button with Glow Effect */}
                <button 
                  onClick={handleComplete} 
                  disabled={cart.length === 0} 
                  className="w-full relative overflow-hidden py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl disabled:from-slate-300 disabled:to-slate-400 text-lg transition-all hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98] group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Check className="w-6 h-6" />
                    Complete Sale
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Checkout Full Screen */}
      {showCheckout && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between shrink-0 bg-slate-50">
            <h2 className="text-xl font-bold">Checkout</h2>
            <button onClick={() => setShowCheckout(false)} className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Customer Selection with Search - Mobile */}
            <div className="p-4 border-b bg-slate-50 relative">
              <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Customer</p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search or select customer..." 
                  className="w-full pl-10 pr-10 py-3.5 bg-white border-2 rounded-xl text-base outline-none focus:border-blue-500 transition-all"
                  value={customerSearch}
                  onFocus={(e) => { e.stopPropagation(); setIsCustomerDropdownOpen(true); }}
                  onChange={(e) => { setCustomerSearch(e.target.value); if (selectedCustomerId) setSelectedCustomerId(''); setIsCustomerDropdownOpen(true); }}
                  onClick={(e) => e.stopPropagation()}
                />
                {selectedCustomer && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(''); setCustomerSearch(''); }} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition active:scale-90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Customer Dropdown - Mobile */}
              {isCustomerDropdownOpen && (
                <div 
                  className="absolute top-full left-4 right-4 mt-1 bg-white border-2 rounded-2xl shadow-2xl z-[100] max-h-72 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.slice(0, 8).map(c => (
                      <button 
                        key={c.id} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedCustomerId(c.id); 
                          setCustomerSearch(c.name); 
                          setIsCustomerDropdownOpen(false); 
                        }} 
                        className={`w-full p-4 text-left hover:bg-blue-50 border-b last:border-b-0 transition flex items-center gap-3 active:bg-blue-100 ${selectedCustomerId === c.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-slate-800">{c.name}</p>
                          <p className="text-sm text-slate-400">{c.phone || 'No phone'}</p>
                        </div>
                        {selectedCustomerId === c.id && (
                          <Check className="w-6 h-6 text-green-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No customers found</p>
                    </div>
                  )}
                  {/* Walk-in option */}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedCustomerId(''); 
                      setCustomerSearch(''); 
                      setIsCustomerDropdownOpen(false); 
                    }} 
                    className="w-full p-4 text-left bg-slate-50 hover:bg-slate-100 border-t flex items-center gap-3 transition active:bg-slate-200"
                  >
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-600">Walk-in Customer</p>
                      <p className="text-sm text-slate-400">No customer selected</p>
                    </div>
                  </button>
                </div>
              )}
              {/* Selected Customer Info - Mobile */}
              {selectedCustomer && (
                <div className="mt-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-800">{selectedCustomer.name}</p>
                      <p className="text-sm text-slate-500">{selectedCustomer.phone || 'No phone'}</p>
                      {selectedCustomer.address && (
                        <p className="text-xs text-slate-400 mt-0.5">{selectedCustomer.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Items with Price Edit - Mobile */}
            <div className="p-4">
              <h3 className="font-bold text-sm text-slate-500 uppercase mb-3">Items ({itemCount})</h3>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.productId} className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-base text-slate-800">{item.productName}</p>
                      <p className="font-bold text-lg text-blue-600">{formatCurrency(item.totalPrice || 0)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {/* Price Edit - Mobile */}
                      <div className="flex items-center gap-2">
                        {editingPriceId === item.productId ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">{CURRENCY_SYMBOL}</span>
                            <input 
                              type="number" 
                              value={tempPrice} 
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-24 h-10 text-center border-2 border-blue-500 rounded-xl font-bold text-base focus:outline-none"
                              autoFocus
                            />
                            <button 
                              onClick={() => { updatePrice(item.productId, parseFloat(tempPrice) || 0); setEditingPriceId(null); }}
                              className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center active:scale-90"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setEditingPriceId(null)}
                              className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center active:scale-90"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setEditingPriceId(item.productId); setTempPrice(String(item.unitPrice || 0)); }}
                            className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-sm font-bold transition active:scale-95"
                          >
                            <Pencil className="w-4 h-4" />
                            {formatCurrency(item.unitPrice || 0)} each
                          </button>
                        )}
                      </div>
                      {/* Quantity - Mobile */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQty(item.productId, item.quantity - 1)} 
                          className="w-10 h-10 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-xl flex items-center justify-center transition active:scale-90"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 0)} 
                          className="w-14 h-10 text-center border-2 rounded-xl font-bold text-base focus:border-blue-500 outline-none" 
                        />
                        <button 
                          onClick={() => updateQty(item.productId, item.quantity + 1)} 
                          className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition active:scale-90"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount - Mobile */}
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Discount</p>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setDiscountType('fixed')} className={`flex-1 py-3 rounded-xl font-bold transition ${discountType === 'fixed' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border'}`}>{CURRENCY_SYMBOL} Fixed</button>
                  <button onClick={() => setDiscountType('percent')} className={`flex-1 py-3 rounded-xl font-bold transition ${discountType === 'percent' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border'}`}>% Percent</button>
                </div>
                {discountType === 'fixed' ? (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{CURRENCY_SYMBOL}</span>
                    <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} placeholder="0.00" className="w-full p-4 pl-10 border-2 rounded-xl font-bold text-xl focus:border-blue-500 outline-none" />
                  </div>
                ) : (
                  <div className="relative">
                    <input type="number" value={discountPercent || ''} onChange={(e) => setDiscountPercent(Math.min(100, Number(e.target.value)))} placeholder="0" max="100" className="w-full p-4 pr-10 border-2 rounded-xl font-bold text-xl focus:border-blue-500 outline-none" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section - Mobile Clean & Eye-Catching */}
          <div className="shrink-0 bg-white border-t-4 border-slate-100 safe-area-pb">
            {/* Animated Total Banner - Clickable to Fill Amount */}
            <div 
              className="relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setAmountPaid(grandTotal)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x"></div>
              <div className="relative p-5 text-white text-center">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Grand Total</p>
                <p className="text-4xl font-black mt-1 drop-shadow-lg">{formatCurrency(grandTotal)}</p>
                {calculatedDiscount > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs line-through">{formatCurrency(subtotal)}</span>
                    <span className="bg-green-400/30 text-green-100 px-2 py-0.5 rounded-full text-xs font-bold">Save {formatCurrency(calculatedDiscount)}</span>
                  </div>
                )}
                <p className="text-white/60 text-xs mt-2">
                  👆 Tap to set as received amount
                </p>
              </div>
            </div>
            
            {/* Payment Area - Mobile */}
            <div className="p-4 bg-slate-50">
              {/* Amount Input with Visual Feedback */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-green-600" />
                    Amount Received
                  </label>
                  {amountPaid > 0 && amountPaid < grandTotal && (
                    <span className="text-xs text-amber-600 font-bold animate-pulse">
                      Due: {formatCurrency(grandTotal - amountPaid)}
                    </span>
                  )}
                </div>
                
                <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${amountPaid >= grandTotal && amountPaid > 0 ? 'ring-4 ring-green-400/50' : amountPaid > 0 ? 'ring-4 ring-amber-400/50' : ''}`}>
                  <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center border-r">
                    <span className="text-xl font-black text-slate-500">{CURRENCY_SYMBOL}</span>
                  </div>
                  <input 
                    type="number" 
                    value={amountPaid || ''} 
                    onChange={(e) => setAmountPaid(Number(e.target.value))} 
                    placeholder="0" 
                    className="w-full p-5 pl-20 pr-4 bg-white border-2 border-slate-200 text-3xl font-black text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-300" 
                  />
                  {amountPaid >= grandTotal && amountPaid > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce-in">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Payment Status Visual - Mobile */}
              {amountPaid > 0 && (
                <div className={`mb-4 p-4 rounded-xl transition-all duration-500 ${amountPaid >= grandTotal ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${amountPaid >= grandTotal ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}>
                      {amountPaid >= grandTotal ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${amountPaid >= grandTotal ? 'text-green-700' : 'text-amber-700'}`}>
                        {amountPaid >= grandTotal ? 'Payment Complete!' : 'Partial Payment'}
                      </p>
                      {amountPaid > grandTotal && (
                        <p className="text-sm text-green-600">Change: <span className="font-bold text-lg">{formatCurrency(amountPaid - grandTotal)}</span></p>
                      )}
                      {amountPaid < grandTotal && (
                        <p className="text-sm text-amber-600">Remaining: <span className="font-bold text-lg">{formatCurrency(grandTotal - amountPaid)}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Complete Button with Glow Effect - Mobile */}
              <button 
                onClick={handleComplete} 
                disabled={cart.length === 0} 
                className="w-full relative overflow-hidden py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl disabled:from-slate-300 disabled:to-slate-400 text-xl transition-all hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98] group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check className="w-6 h-6" />
                  Complete Sale
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>
      )}

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
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScannerPOS;
