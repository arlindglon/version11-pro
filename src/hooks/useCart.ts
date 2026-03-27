'use client';

import { useState, useMemo, useCallback } from 'react';
import { Product, SaleItem } from '@/types';

export interface CartState {
  items: SaleItem[];
  subtotal: number;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  calculatedDiscount: number;
  grandTotal: number;
  itemCount: number;
  amountPaid: number;
}

export interface CartActions {
  addToCart: (product: Product, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setDiscountType: (type: 'fixed' | 'percent') => void;
  setDiscountValue: (value: number) => void;
  setAmountPaid: (amount: number) => void;
  getQty: (productId: string) => number;
}

export type CartStore = CartState & CartActions;

export function useCart(): CartStore {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  // Calculations
  const subtotal = useMemo(() => 
    cart.reduce((acc, item) => acc + (item.totalPrice || 0), 0), 
    [cart]
  );

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  }, [subtotal, discountType, discountValue]);

  const grandTotal = useMemo(() => 
    Math.max(0, subtotal - calculatedDiscount), 
    [subtotal, calculatedDiscount]
  );

  const itemCount = useMemo(() => 
    cart.reduce((a, b) => a + b.quantity, 0), 
    [cart]
  );

  // Actions
  const addToCart = useCallback((product: Product, qty: number = 1) => {
    if (!product || !product.id) return;
    
    const productName = product.name || 'Unknown Product';
    const unitPrice = product.salePrice || 0;
    
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
        productName,
        sku: product.sku || '',
        quantity: 1,
        unitPrice,
        discount: 0,
        taxAmount: 0,
        totalPrice: unitPrice,
        isReturned: false,
        returnedQty: 0
      }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.productId !== productId));
    } else {
      setCart(prev => prev.map(i => 
        i.productId === productId 
          ? { ...i, quantity: qty, totalPrice: qty * (i.unitPrice || 0) } 
          : i
      ));
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountValue(0);
    setAmountPaid(0);
  }, []);

  const getQty = useCallback((productId: string) => 
    cart.find(i => i.productId === productId)?.quantity || 0, 
    [cart]
  );

  const handleSetDiscountValue = useCallback((value: number) => {
    // Cap percentage at 100
    if (discountType === 'percent') {
      setDiscountValue(Math.min(100, value));
    } else {
      setDiscountValue(value);
    }
  }, [discountType]);

  return {
    // State
    items: cart,
    subtotal,
    discountType,
    discountValue,
    calculatedDiscount,
    grandTotal,
    itemCount,
    amountPaid,
    // Actions
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    setDiscountType,
    setDiscountValue: handleSetDiscountValue,
    setAmountPaid,
    getQty,
  };
}
