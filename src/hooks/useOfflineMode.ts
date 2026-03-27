'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '@/lib/offline-service';
import { SyncState } from '@/lib/sync-service';

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    error: null,
  });

  useEffect(() => {
    // Subscribe to sync state
    const unsubscribe = offlineDB.subscribeToSync((state) => {
      setSyncState(state);
      setIsOnline(state.isOnline);
    });

    // Handle online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline) return;
    await offlineDB.syncFromServer();
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    syncState,
    syncNow,
    pendingCount: syncState.pendingCount,
    isSyncing: syncState.isSyncing,
  };
}

// Hook for managing products with offline support
export function useOfflineProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineDB.getProducts();
      setProducts(data as []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (data: Record<string, unknown>) => {
    const product = await offlineDB.createProduct(data);
    await fetchProducts();
    return product;
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, data: Record<string, unknown>) => {
    const product = await offlineDB.updateProduct(id, data);
    await fetchProducts();
    return product;
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    await offlineDB.deleteProduct(id);
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

// Hook for managing customers with offline support
export function useOfflineCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineDB.getCustomers();
      setCustomers(data as []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const createCustomer = useCallback(async (data: Record<string, unknown>) => {
    const customer = await offlineDB.createCustomer(data);
    await fetchCustomers();
    return customer;
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    refetch: fetchCustomers,
    createCustomer,
  };
}

// Hook for managing sales with offline support
export function useOfflineSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineDB.getSales();
      setSales(data as []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const createSale = useCallback(async (data: Record<string, unknown>) => {
    const sale = await offlineDB.createSale(data);
    await fetchSales();
    return sale;
  }, [fetchSales]);

  return {
    sales,
    loading,
    refetch: fetchSales,
    createSale,
  };
}
