'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { View, Product, Customer, Supplier, Sale, Purchase, Expense, AppSettings, User, AuditLog } from '@/types';
import Dashboard from '@/components/dokan/Dashboard';
import POS from '@/components/dokan/POS';
import ScannerPOS from '@/components/dokan/ScannerPOS';
import Inventory from '@/components/dokan/Inventory';
import People from '@/components/dokan/People';
import Accounting from '@/components/dokan/Accounting';
import Reports from '@/components/dokan/Reports';
import Purchases from '@/components/dokan/Purchases';
import SalesHistory from '@/components/dokan/SalesHistory';
import Settings from '@/components/dokan/Settings';
import Login from '@/components/dokan/Login';
import ActivityLogs from '@/components/dokan/ActivityLogs';
import PrintReceipt from '@/components/dokan/PrintReceipt';
import Support from '@/components/dokan/Support';
import AppFooter from '@/components/dokan/AppFooter';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  ShoppingBag, 
  Users, 
  Truck, 
  Calculator, 
  BarChart3, 
  Settings as SettingsIcon,
  Menu,
  X,
  Scan,
  LogOut,
  User as UserIcon,
  Globe,
  Sparkles,
  ChevronRight,
  Zap,
  Activity,
  HelpCircle,
  Clock
} from 'lucide-react';

function AppContent() {
  const { language, setLanguage, t, isBangla } = useLanguage();
  const [activeView, setActiveView] = useState<View>(() => {
    // Restore from localStorage on initial load
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dokan_active_view');
      if (saved) return saved as View;
    }
    return 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  
  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Save activeView to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dokan_active_view', activeView);
  }, [activeView]);
  
  // Format time in Bangla or English
  const formatLiveTime = () => {
    if (isBangla) {
      // Bangla numerals and period
      const banglaNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const hours = liveTime.getHours();
      const minutes = liveTime.getMinutes();
      const seconds = liveTime.getSeconds();
      const period = hours >= 12 ? 'পিএম' : 'এএম';
      const displayHours = hours % 12 || 12;
      
      const toBangla = (num: number) => String(num).split('').map(d => banglaNumerals[parseInt(d)]).join('');
      
      return `${toBangla(displayHours)}:${toBangla(minutes.toString().padStart(2, '0'))}:${toBangla(seconds.toString().padStart(2, '0'))} ${period}`;
    }
    return liveTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string; username: string; permissions?: Record<string, boolean> } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Loading screen settings (fetched first for immediate display)
  const [loadingSettings, setLoadingSettings] = useState<{
    shopName: string;
    shopLogo: string;
    shopBio: string;
    loadingText: string;
  } | null>(null);
  
  // Data states
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile view state - for navigation from Accounting
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  
  // Print dialog state - for auto print after sale
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('dokan_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('dokan_user');
      }
    }
    setIsCheckingAuth(false);
  }, []);

  // Fetch loading settings first (for immediate display)
  useEffect(() => {
    const fetchLoadingSettings = async () => {
      try {
        const res = await fetch('/api/loading-settings');
        const data = await res.json();
        setLoadingSettings(data);
      } catch (error) {
        console.error('Failed to fetch loading settings:', error);
      }
    };
    fetchLoadingSettings();
  }, []);

  // Handle login
  const handleLogin = (user: { id: string; name: string; email: string; role: string; username: string; permissions?: Record<string, boolean> }) => {
    setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('dokan_user');
    setCurrentUser(null);
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Function to refresh all data
  const fetchData = useCallback(async () => {
    try {
      // Only seed once per session (check localStorage)
      const hasSeeded = sessionStorage.getItem('dokan_seeded');
      if (!hasSeeded) {
        await fetch('/api/seed', { method: 'POST' });
        sessionStorage.setItem('dokan_seeded', 'true');
      }
      
      const [settingsRes, usersRes, productsRes, customersRes, suppliersRes, salesRes, purchasesRes, expensesRes, categoriesRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users'),
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/suppliers'),
        fetch('/api/sales'),
        fetch('/api/purchases'),
        fetch('/api/expenses'),
        fetch('/api/categories'),
      ]);

      const [settingsData, usersData, productsData, customersData, suppliersData, salesData, purchasesData, expensesData, categoriesData] = await Promise.all([
        settingsRes.json(),
        usersRes.json(),
        productsRes.json(),
        customersRes.json(),
        suppliersRes.json(),
        salesRes.json(),
        purchasesRes.json(),
        expensesRes.json(),
        categoriesRes.json(),
      ]);

      setSettings(settingsData || null);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData.map((c: { name: string }) => c.name) : []);
      
      // Update document title with shop name
      if (settingsData?.shopName) {
        document.title = `${settingsData.shopName} - POS & Inventory`;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update document title when settings change
  useEffect(() => {
    if (settings?.shopName) {
      document.title = `${settings.shopName} - POS & Inventory`;
    }
  }, [settings?.shopName]);

  // Helper function to get headers with user context
  const getAuthHeaders = useCallback((contentType = true): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = 'application/json';
    if (currentUser?.id) headers['x-user-id'] = currentUser.id;
    if (currentUser?.name) headers['x-user-name'] = currentUser.name;
    if (currentUser?.role) headers['x-user-role'] = currentUser.role;
    return headers;
  }, [currentUser]);

  // API handlers
  const handleAddProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    const newProduct = await res.json();
    setProducts(prev => [newProduct, ...prev]);
  }, [getAuthHeaders]);

  const handleUpdateProduct = useCallback(async (id: string, product: Partial<Product>) => {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
  }, [getAuthHeaders]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    await fetch(`/api/products/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [getAuthHeaders]);

  const handleAddCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    const newCustomer = await res.json();
    setCustomers(prev => [newCustomer, ...prev]);
  }, [getAuthHeaders]);

  const handleUpdateCustomer = useCallback(async (id: string, customer: Partial<Customer>) => {
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customer } : c));
  }, []);

  const handleDeleteCustomer = useCallback(async (id: string) => {
    await fetch(`/api/customers/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, [getAuthHeaders]);

  const handleAddSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(supplier),
    });
    const newSupplier = await res.json();
    setSuppliers(prev => [newSupplier, ...prev]);
  }, [getAuthHeaders]);

  const handleDeleteSupplier = useCallback(async (id: string) => {
    await fetch(`/api/suppliers/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, [getAuthHeaders]);

  const handleAddSale = useCallback(async (sale: Sale) => {
    try {
      // Add salesman/created by information
      const saleWithSalesman = {
        ...sale,
        createdByName: currentUser?.name || 'System',
        salesmanName: currentUser?.name || 'System',
        createdBy: currentUser?.id,
        salesmanId: currentUser?.id,
      };
      
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(saleWithSalesman),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Sale creation failed:', errorData);
        alert(`Sale failed: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const newSale = await res.json();
      setSales(prev => [newSale, ...prev]);
      
      // Update local products state (stock is already updated in the API)
      setProducts(prev => prev.map(p => {
        const soldItem = sale.items.find(item => item.productId === p.id);
        if (soldItem) {
          return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
        }
        return p;
      }));
      
      // Update customer due if applicable
      if (sale.due > 0 && sale.customerId && sale.customerId !== 'walk-in') {
        setCustomers(prev => prev.map(c => {
          if (c.id === sale.customerId) {
            const newDue = c.due + sale.due;
            fetch(`/api/customers/${sale.customerId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ due: newDue }),
            }).catch(err => console.error('Failed to update customer due:', err));
            return { ...c, due: newDue };
          }
          return c;
        }));
      }
      
      // Auto redirect to print dialog
      setLastCompletedSale(newSale);
      setShowPrintDialog(true);
      
    } catch (error) {
      console.error('Sale creation error:', error);
      alert('Failed to create sale. Please try again.');
    }
  }, [getAuthHeaders, currentUser]);

  const handleDeleteSale = useCallback(async (id: string) => {
    // Find the sale to get its items
    const sale = sales.find(s => s.id === id);
    
    // Delete from database (stock restoration is handled in the API)
    await fetch(`/api/sales/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    setSales(prev => prev.filter(s => s.id !== id));
    
    // Update local products state
    if (sale) {
      setProducts(prev => prev.map(p => {
        const soldItem = sale.items.find(item => item.productId === p.id);
        if (soldItem) {
          return { ...p, stock: p.stock + soldItem.quantity };
        }
        return p;
      }));
      
      // Update customer due if applicable
      if (sale.due > 0 && sale.customerId !== 'walk-in') {
        setCustomers(prev => prev.map(c => {
          if (c.id === sale.customerId) {
            const newDue = Math.max(0, c.due - sale.due);
            fetch(`/api/customers/${sale.customerId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ due: newDue }),
            }).catch(err => console.error('Failed to update customer due:', err));
            return { ...c, due: newDue };
          }
          return c;
        }));
      }
    }
  }, [sales]);

  const handleUpdateSale = useCallback(async (id: string, updatedSale: Partial<Sale>) => {
    const oldSale = sales.find(s => s.id === id);
    if (!oldSale) return;

    const res = await fetch(`/api/sales/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedSale),
    });
    
    // Get the response to include updated payments and history arrays
    const updatedData = await res.json();
    
    // Update local state with the full response data including payments and history
    setSales(prev => prev.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          ...updatedSale,
          // Include the payments and history arrays from the API response
          payments: updatedData.payments || s.payments || [],
          history: updatedData.history || s.history || [],
        };
      }
      return s;
    }));

    if (updatedSale.items) {
      for (const item of oldSale.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await handleUpdateProduct(item.productId, { stock: product.stock + item.quantity });
        }
      }
      for (const item of updatedSale.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await handleUpdateProduct(item.productId, { stock: Math.max(0, product.stock - item.quantity) });
        }
      }
    }

    if (updatedSale.due !== undefined && oldSale.customerId !== 'walk-in') {
      const oldDue = oldSale.due || 0;
      const newDue = updatedSale.due || 0;
      const dueDiff = newDue - oldDue;
      
      if (dueDiff !== 0) {
        const customer = customers.find(c => c.id === oldSale.customerId);
        if (customer) {
          await handleUpdateCustomer(oldSale.customerId, { due: Math.max(0, customer.due + dueDiff) });
        }
      }
    }
  }, [sales, products, customers, handleUpdateProduct, handleUpdateCustomer, getAuthHeaders]);

  const handleAddPurchase = useCallback(async (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Create the purchase record (stock is updated in the API)
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(purchase),
    });
    const newPurchase = await res.json();
    setPurchases(prev => [newPurchase, ...prev]);
    
    // Update local products state to reflect stock changes
    if (purchase.items && purchase.items.length > 0) {
      setProducts(prev => prev.map(p => {
        const purchasedItem = purchase.items.find(item => item.productId === p.id);
        if (purchasedItem) {
          return { ...p, stock: p.stock + purchasedItem.quantity };
        }
        return p;
      }));
    }
    
    // Update supplier balance if there's unpaid amount
    if (purchase.balance > 0 && purchase.supplierId) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === purchase.supplierId) {
          const newBalance = (s.balance || 0) + purchase.balance;
          // Update in database
          fetch(`/api/suppliers/${purchase.supplierId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ balance: newBalance }),
          }).catch(err => console.error('Failed to update supplier balance:', err));
          return { ...s, balance: newBalance };
        }
        return s;
      }));
    }
  }, [getAuthHeaders]);

  const handleDeletePurchase = useCallback(async (id: string) => {
    // Find the purchase to get its items
    const purchase = purchases.find(p => p.id === id);
    
    // Delete from database (stock reduction is handled in the API)
    await fetch(`/api/purchases/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    setPurchases(prev => prev.filter(p => p.id !== id));
    
    // Update local products state
    if (purchase) {
      setProducts(prev => prev.map(p => {
        const purchasedItem = purchase.items.find(item => item.productId === p.id);
        if (purchasedItem) {
          return { ...p, stock: Math.max(0, p.stock - purchasedItem.quantity) };
        }
        return p;
      }));
      
      // Update supplier balance - reduce the balance when purchase is deleted
      if (purchase.balance > 0 && purchase.supplierId) {
        setSuppliers(prev => prev.map(s => {
          if (s.id === purchase.supplierId) {
            const newBalance = Math.max(0, (s.balance || 0) - purchase.balance);
            fetch(`/api/suppliers/${purchase.supplierId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ balance: newBalance }),
            }).catch(err => console.error('Failed to update supplier balance:', err));
            return { ...s, balance: newBalance };
          }
          return s;
        }));
      }
    }
  }, [purchases, getAuthHeaders]);

  const handleUpdatePurchase = useCallback(async (id: string, purchase: Partial<Purchase>, auditLog?: Partial<AuditLog>) => {
    // Get the old purchase to calculate balance change
    const oldPurchase = purchases.find(p => p.id === id);
    
    const res = await fetch('/api/purchases', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, ...purchase, auditLog }),
    });
    
    // Get the response to include updated payments array
    const updatedData = await res.json();
    
    // Update local state with the full response data including payments
    setPurchases(prev => prev.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          ...purchase,
          // Include the payments array from the API response
          payments: updatedData.payments || p.payments || [],
        };
      }
      return p;
    }));
    
    // Update supplier balance if balance changed
    if (purchase.balance !== undefined && oldPurchase && oldPurchase.supplierId) {
      const oldBalance = oldPurchase.balance || 0;
      const newBalance = purchase.balance || 0;
      const balanceDiff = newBalance - oldBalance;
      
      if (balanceDiff !== 0 && oldPurchase.supplierId) {
        setSuppliers(prev => prev.map(s => {
          if (s.id === oldPurchase.supplierId) {
            const updatedBalance = Math.max(0, (s.balance || 0) + balanceDiff);
            fetch(`/api/suppliers/${oldPurchase.supplierId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ balance: updatedBalance }),
            }).catch(err => console.error('Failed to update supplier balance:', err));
            return { ...s, balance: updatedBalance };
          }
          return s;
        }));
      }
    }
  }, [purchases, getAuthHeaders]);

  const handleAddExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense),
    });
    const newExpense = await res.json();
    setExpenses(prev => [newExpense, ...prev]);
  }, [getAuthHeaders]);

  const handleUpdateExpense = useCallback(async (id: string, expense: Partial<Expense>) => {
    console.log('handleUpdateExpense called with:', id, expense);
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...expense }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Update expense API error:', errorData);
        throw new Error(errorData.details || 'Failed to update expense');
      }
      
      const updatedExpense = await res.json();
      console.log('Update expense response:', updatedExpense);
      
      setExpenses(prev => {
        const newExpenses = prev.map(e => e.id === id ? { ...e, ...updatedExpense } : e);
        console.log('Updated expenses state');
        return newExpenses;
      });
    } catch (error) {
      console.error('Failed to update expense:', error);
      throw error;
    }
  }, [getAuthHeaders]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    await fetch(`/api/expenses?id=${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, [getAuthHeaders]);

  const handleUpdateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    console.log('handleUpdateSettings called with:', newSettings);
    console.log('Current settings:', settings);
    
    const payload = { ...settings, ...newSettings };
    console.log('Sending payload:', payload);
    
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    console.log('API response:', updated);
    setSettings(updated);
  }, [settings, getAuthHeaders]);

  // User handlers
  const handleAddUser = useCallback(async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    const newUser = await res.json();
    setUsers(prev => [newUser, ...prev]);
  }, [getAuthHeaders]);

  const handleUpdateUser = useCallback(async (id: string, user: Partial<User>) => {
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...user } : u));
  }, [getAuthHeaders]);

  const handleDeleteUser = useCallback(async (id: string) => {
    await fetch(`/api/users/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    setUsers(prev => prev.filter(u => u.id !== id));
  }, [getAuthHeaders]);

  // Category handlers
  const handleAddCategory = useCallback(async (category: string) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: category }),
    });
    if (res.ok) {
      setCategories(prev => [...prev, category]);
    }
  }, [getAuthHeaders]);

  const handleDeleteCategory = useCallback(async (category: string) => {
    const res = await fetch(`/api/categories?name=${encodeURIComponent(category)}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    if (res.ok) {
      setCategories(prev => prev.filter(c => c !== category));
    }
  }, [getAuthHeaders]);

  // Check if user has permission
  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    // ONLY Master Admin has full access to everything
    if (currentUser.role === 'Master Admin') return true;
    // All other roles (including Admin) must have explicit permission
    return currentUser.permissions?.[permission] === true;
  };

  const allNavItems: { view: View; label: string; icon: React.ReactNode; permission?: string; gradient: string }[] = [
    { view: 'dashboard', label: t('common.dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-600' },
    { view: 'pos-scanner', label: t('common.scanner_pos'), icon: <Scan className="w-5 h-5" />, permission: 'pos_access', gradient: 'from-emerald-500 to-teal-600' },
    { view: 'pos', label: t('common.standard_pos'), icon: <ShoppingCart className="w-5 h-5" />, permission: 'pos_access', gradient: 'from-blue-500 to-cyan-600' },
    { view: 'inventory', label: t('common.inventory'), icon: <Package className="w-5 h-5" />, permission: 'inventory_view', gradient: 'from-amber-500 to-orange-600' },
    { view: 'sales', label: t('common.sales_history'), icon: <History className="w-5 h-5" />, permission: 'sales_view', gradient: 'from-green-500 to-emerald-600' },
    { view: 'purchases', label: t('common.purchases'), icon: <ShoppingBag className="w-5 h-5" />, permission: 'purchases_view', gradient: 'from-rose-500 to-pink-600' },
    { view: 'customers', label: t('common.customers'), icon: <Users className="w-5 h-5" />, permission: 'customers_view', gradient: 'from-indigo-500 to-violet-600' },
    { view: 'suppliers', label: t('common.suppliers'), icon: <Truck className="w-5 h-5" />, permission: 'suppliers_view', gradient: 'from-sky-500 to-blue-600' },
    { view: 'accounting', label: t('common.accounting'), icon: <Calculator className="w-5 h-5" />, permission: 'accounting_view', gradient: 'from-fuchsia-500 to-pink-600' },
    { view: 'reports', label: t('common.reports'), icon: <BarChart3 className="w-5 h-5" />, permission: 'reports_view', gradient: 'from-cyan-500 to-teal-600' },
    { view: 'settings', label: t('common.settings'), icon: <SettingsIcon className="w-5 h-5" />, permission: 'settings_view', gradient: 'from-slate-500 to-gray-600' },
    { view: 'activity-logs', label: t('common.activity_logs') || 'Activity Logs', icon: <Activity className="w-5 h-5" />, permission: 'activity_logs', gradient: 'from-violet-500 to-purple-600' },
    { view: 'support', label: t('common.support') || 'Support', icon: <HelpCircle className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-600' },
  ];

  const navItems = allNavItems.filter(item => !item.permission || hasPermission(item.permission));

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': 
        return <Dashboard sales={sales} purchases={purchases} products={products} customers={customers} suppliers={suppliers} expenses={expenses} settings={settings} />;
      case 'inventory': 
        return (
          <Inventory 
            products={products} 
            categories={categories} 
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            currentUserRole={currentUser?.role}
            currentUserPermissions={currentUser?.permissions}
          />
        );
      case 'pos':
        return <POS products={products} customers={customers} categories={categories} settings={settings} onComplete={handleAddSale} />;
      case 'pos-scanner':
        return <ScannerPOS products={products} customers={customers} settings={settings} onComplete={handleAddSale} />;
      case 'sales': 
        return (
          <SalesHistory 
            sales={sales} 
            products={products} 
            customers={customers} 
            purchases={purchases}
            suppliers={suppliers}
            onDeleteSale={handleDeleteSale} 
            onUpdateSale={handleUpdateSale} 
            onDeletePurchase={handleDeletePurchase}
            onUpdatePurchase={handleUpdatePurchase}
            settings={settings} 
            currentUserRole={currentUser?.role}
            currentUserPermissions={currentUser?.permissions}
          />
        );
      case 'purchases': 
        return (
          <Purchases 
            products={products} 
            suppliers={suppliers} 
            purchases={purchases} 
            onAddPurchase={handleAddPurchase}
            onDeletePurchase={handleDeletePurchase}
            onUpdatePurchase={handleUpdatePurchase}
            currentUserRole={currentUser?.role}
            currentUserPermissions={currentUser?.permissions}
          />
        );
      case 'customers': 
        return (
          <People 
            type="Customer" 
            data={customers} 
            sales={sales}
            products={products}
            onAdd={handleAddCustomer}
            onUpdate={handleUpdateCustomer}
            onDelete={handleDeleteCustomer}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
            settings={settings}
            selectedId={selectedCustomerId}
            onClearSelected={() => setSelectedCustomerId(null)}
            currentUserRole={currentUser?.role}
            currentUserPermissions={currentUser?.permissions}
          />
        );
      case 'suppliers': 
        return (
          <People 
            type="Supplier" 
            data={suppliers} 
            sales={sales}
            purchases={purchases}
            products={products}
            onAdd={handleAddSupplier}
            onUpdate={() => {}}
            onDelete={handleDeleteSupplier}
            onUpdateSale={handleUpdateSale}
            onUpdatePurchase={handleUpdatePurchase}
            onDeleteSale={handleDeleteSale}
            onDeletePurchase={handleDeletePurchase}
            settings={settings}
            selectedId={selectedSupplierId}
            onClearSelected={() => setSelectedSupplierId(null)}
            currentUserRole={currentUser?.role}
            currentUserPermissions={currentUser?.permissions}
          />
        );
      case 'accounting': 
        return (
          <Accounting 
            expenses={expenses} 
            sales={sales} 
            purchases={purchases} 
            customers={customers}
            suppliers={suppliers}
            currentUser={currentUser}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateSupplier={async (id, supplier) => {
              await fetch(`/api/suppliers/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(supplier),
              });
              setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplier } : s));
            }}
            onViewCustomerProfile={(id) => {
              setSelectedCustomerId(id);
              setActiveView('customers');
            }}
            onViewSupplierProfile={(id) => {
              setSelectedSupplierId(id);
              setActiveView('suppliers');
            }}
          />
        );
      case 'reports': 
        return <Reports sales={sales} products={products} expenses={expenses} purchases={purchases} users={users} customers={customers} currentUser={currentUser} onDataRefresh={fetchData} />;
      case 'settings': 
        return (
          <Settings 
            settings={settings} 
            users={users} 
            onUpdateSettings={handleUpdateSettings}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            currentUserRole={currentUser?.role}
            currentUserPermissions={currentUser?.permissions}
          />
        );
      case 'activity-logs':
        return (
          <ActivityLogs 
            currentUserRole={currentUser?.role}
          />
        );
      case 'support':
        return (
          <Support 
            currentUserRole={currentUser?.role}
          />
        );
      default: 
        return <div className="p-6">Not Found</div>;
    }
  };

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 animate-spin-slow"></div>
            <div className="absolute inset-2 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
              {loadingSettings?.shopLogo ? (
                <img src={loadingSettings.shopLogo} alt={loadingSettings.shopName || 'Shop'} className="w-full h-full object-contain" />
              ) : (
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{loadingSettings?.shopName || t('app.name')}</h1>
          <p className="text-purple-300 font-medium mb-6">{loadingSettings?.shopBio || t('app.tagline')}</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-slate-400 text-sm mt-4">{loadingSettings?.loadingText || t('msg.loading')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50">
      <div className="flex flex-1">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 z-50 shadow-sm">
        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all">
          <Menu className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex items-center gap-2">
          {settings?.shopLogo ? (
            <img src={settings.shopLogo} alt={settings.shopName || 'Shop'} className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{settings?.shopName || t('app.name')}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Live Clock */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <Clock className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-bold text-slate-700 font-mono">{formatLiveTime()}</span>
          </div>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Globe className="w-5 h-5 text-slate-600" />
            <span className="text-xs font-bold text-slate-600">{language === 'en' ? 'বাং' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setIsMobileSidebarOpen(false)}>
          <aside className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                {settings?.shopLogo ? (
                  <img src={settings.shopLogo} alt={settings.shopName || 'Shop'} className="w-12 h-12 rounded-2xl object-contain shadow-lg" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <span className="text-xl font-bold block leading-tight">{settings?.shopName?.split(' ')[0] || t('app.name')}</span>
                  <span className="text-xs text-purple-400 font-medium">{settings?.shopBio || t('app.tagline')}</span>
                </div>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Language Toggle */}
            <div className="px-4 py-3 border-b border-white/10">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">{language === 'en' ? 'বাংলা' : 'English'}</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all ${language === 'bn' ? 'bg-purple-600' : 'bg-slate-600'} relative`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${language === 'bn' ? 'right-1' : 'left-1'}`}></div>
                </div>
              </button>
            </div>
            
            <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
              {navItems.map((item) => (
                <button 
                  key={item.view} 
                  onClick={() => { setActiveView(item.view); setIsMobileSidebarOpen(false); }} 
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                    activeView === item.view 
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    activeView === item.view ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    {item.icon}
                  </div>
                  <span className="font-semibold text-sm">{item.label}</span>
                  {activeView === item.view && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </nav>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                    {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{currentUser?.name || 'User'}</p>
                    <p className="text-xs text-purple-400">{currentUser?.role || ''}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { handleLogout(); setIsMobileSidebarOpen(false); }}
                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex ${isSidebarCollapsed ? 'w-24' : 'w-72'} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex-shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out border-r border-white/5 flex-col z-50`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
          {settings?.shopLogo ? (
            <img src={settings.shopLogo} alt={settings.shopName || 'Shop'} className="w-12 h-12 rounded-2xl object-contain shadow-xl flex-shrink-0 cursor-pointer hover:shadow-purple-500/50 transition-all" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all cursor-pointer">
              <Zap className="w-6 h-6 text-white" />
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <span className="text-xl font-bold tracking-tight block leading-none">{settings?.shopName?.split(' ')[0] || t('app.name')}</span>
              <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">{settings?.shopBio || t('app.tagline')}</span>
            </div>
          )}
        </div>
        
        {/* Language Toggle & Live Clock */}
        {!isSidebarCollapsed && (
          <div className="px-4 pb-3 space-y-2">
            {/* Live Clock */}
            <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-xl border border-purple-500/30">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-white font-mono tracking-wider">{formatLiveTime()}</span>
            </div>
            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-sm">{language === 'en' ? 'বাংলা' : 'English'}</span>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all ${language === 'bn' ? 'bg-purple-600' : 'bg-slate-600'} relative`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${language === 'bn' ? 'right-1' : 'left-1'}`}></div>
              </div>
            </button>
          </div>
        )}
        
        {/* Collapsed Sidebar - Show only clock icon */}
        {isSidebarCollapsed && (
          <div className="px-3 pb-3 flex justify-center">
            <div className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all group relative">
              <Clock className="w-5 h-5 text-purple-400" />
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 rounded-lg text-sm font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {formatLiveTime()}
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <button 
              key={item.view} 
              onClick={() => setActiveView(item.view)} 
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3.5 rounded-xl transition-all group relative ${
                activeView === item.view 
                  ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl` 
                  : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                activeView === item.view ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
              }`}>
                {item.icon}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>
                  {activeView === item.view && <ChevronRight className="w-4 h-4 ml-auto" />}
                </>
              )}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 rounded-lg text-sm font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>
        
        {/* User Profile Section */}
        <div className="p-4 border-t border-white/10">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-purple-400 truncate">{currentUser?.email || ''}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex justify-center"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-4 text-slate-500 hover:text-white transition-all flex justify-center"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <span className="text-sm font-bold">«</span>}
          </div>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-16 lg:pt-0">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 h-20 sticky top-0 z-40 flex items-center justify-between px-6 lg:px-10 hidden lg:flex">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${navItems.find(n => n.view === activeView)?.gradient || 'from-slate-500 to-gray-600'} flex items-center justify-center shadow-lg`}>
              {navItems.find(n => n.view === activeView)?.icon || <LayoutDashboard className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
                {navItems.find(n => n.view === activeView)?.label || activeView}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <Globe className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-bold text-slate-700">{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
          </div>
        </header>
        <div className="max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>
      </div>
      
      {/* Auto Print Dialog - Shows after sale completion */}
      <PrintReceipt
        open={showPrintDialog}
        onClose={() => {
          setShowPrintDialog(false);
          setLastCompletedSale(null);
          setActiveView('sales');
        }}
        sale={lastCompletedSale}
        settings={settings}
        currentUser={currentUser}
        autoPrint={settings?.autoPrintOnSale || false}
        autoPrintType={settings?.autoPrintType || 'thermal'}
      />
      
      {/* Footer */}
      <AppFooter settings={settings} onNavigate={(view) => setActiveView(view as View)} />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
