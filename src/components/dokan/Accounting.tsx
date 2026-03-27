'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Expense, Sale, Purchase, Customer, Supplier } from '@/types';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Printer,
  History,
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calculator,
  Calendar,
  FileText,
  Receipt,
  CreditCard,
  Users,
  Truck,
  PiggyBank,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Props {
  expenses: Expense[];
  sales: Sale[];
  purchases: Purchase[];
  customers?: Customer[];
  suppliers?: Supplier[];
  currentUser?: { id: string; name: string; role?: string; permissions?: Record<string, boolean> } | null;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExpense?: (id: string, expense: Partial<Expense>) => Promise<void>;
  onDeleteExpense?: (id: string) => Promise<void>;
  onUpdateCustomer?: (id: string, customer: Partial<Customer>) => Promise<void>;
  onUpdateSupplier?: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  onViewCustomerProfile?: (customerId: string) => void;
  onViewSupplierProfile?: (supplierId: string) => void;
}

const categoryIcons: Record<string, string> = {
  Rent: '🏠',
  Utilities: '💡',
  Salaries: '👥',
  Supplies: '📦',
  Marketing: '📢',
  Other: '📋',
};

const categoryColors: Record<string, string> = {
  Rent: 'bg-purple-100 text-purple-700',
  Utilities: 'bg-yellow-100 text-yellow-700',
  Salaries: 'bg-blue-100 text-blue-700',
  Supplies: 'bg-green-100 text-green-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Other: 'bg-slate-100 text-slate-700',
};

const Accounting: React.FC<Props> = ({ 
  expenses, 
  sales, 
  purchases,
  customers = [],
  suppliers = [],
  currentUser,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateCustomer,
  onUpdateSupplier,
  onViewCustomerProfile,
  onViewSupplierProfile
}) => {
  // Permission checks - ONLY Master Admin has full access, all others need explicit permissions
  const isMasterAdmin = currentUser?.role === 'Master Admin';
  const canCreate = isMasterAdmin || currentUser?.permissions?.expenses_create === true;
  const canEdit = isMasterAdmin || currentUser?.permissions?.expenses_edit === true;
  const canDelete = isMasterAdmin || currentUser?.permissions?.expenses_delete === true;
  
  const [activeTab, setActiveTab] = useState('expenses');
  
  // Expense states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  
  // Custom category states
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Default expense categories
  const defaultCategories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Transport', 'Maintenance', 'Office Supplies', 'Insurance', 'Taxes', 'Other'];
  const allCategories = [...defaultCategories, ...customCategories];

  // Add custom category
  const handleAddCustomCategory = () => {
    if (newCategoryName.trim() && !allCategories.includes(newCategoryName.trim())) {
      setCustomCategories(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalPurchaseCosts = purchases.reduce((acc, p) => acc + p.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalSales - totalPurchaseCosts - totalExpenses;

    return { totalSales, totalPurchaseCosts, totalExpenses, netProfit };
  }, [sales, purchases, expenses]);

  // Customer/Supplier Dues - Calculate from actual sales/purchases
  const customerDuesData = useMemo(() => {
    // Group sales by customer and calculate total due for each
    const customerDueMap = new Map<string, { customer: Customer; totalDue: number; totalSpent: number; totalPaid: number }>();

    // Process all sales
    sales.forEach(sale => {
      if (!sale.customerId || sale.customerId === 'walk-in') return;

      const existing = customerDueMap.get(sale.customerId);
      if (existing) {
        existing.totalSpent += sale.total;
        existing.totalPaid += sale.paid;
        existing.totalDue += sale.due;
      } else {
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
          customerDueMap.set(sale.customerId, {
            customer,
            totalSpent: sale.total,
            totalPaid: sale.paid,
            totalDue: sale.due
          });
        }
      }
    });

    // Convert to array and filter customers with due > 0
    return Array.from(customerDueMap.values())
      .filter(item => item.totalDue > 0)
      .sort((a, b) => b.totalDue - a.totalDue);
  }, [sales, customers]);

  const supplierDuesData = useMemo(() => {
    // Group purchases by supplier and calculate total balance for each
    const supplierBalanceMap = new Map<string, { supplier: Supplier; totalBalance: number; totalAmount: number; totalPaid: number }>();

    // Process all purchases
    purchases.forEach(purchase => {
      if (!purchase.supplierId && !purchase.supplierName) return;

      const key = purchase.supplierId || purchase.supplierName;
      const existing = supplierBalanceMap.get(key!);

      if (existing) {
        existing.totalAmount += purchase.total;
        existing.totalPaid += purchase.paid;
        existing.totalBalance += purchase.balance;
      } else {
        const supplier = suppliers.find(s =>
          s.id === purchase.supplierId ||
          (purchase.supplierName && s.name.toLowerCase() === purchase.supplierName.toLowerCase())
        );
        if (supplier) {
          supplierBalanceMap.set(key!, {
            supplier,
            totalAmount: purchase.total,
            totalPaid: purchase.paid,
            totalBalance: purchase.balance
          });
        }
      }
    });

    // Convert to array and filter suppliers with balance > 0
    return Array.from(supplierBalanceMap.values())
      .filter(item => item.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance);
  }, [purchases, suppliers]);

  const totalCustomerDue = customerDuesData.reduce((sum, item) => sum + item.totalDue, 0);
  const totalSupplierDue = supplierDuesData.reduce((sum, item) => sum + item.totalBalance, 0);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, { expenses: Expense[]; dailyTotal: number }> = {};
    expenses.forEach(exp => {
      const dateKey = new Date(exp.date).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = { expenses: [], dailyTotal: 0 };
      groups[dateKey].expenses.push(exp);
      groups[dateKey].dailyTotal += exp.amount;
    });
    return groups;
  }, [expenses]);

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "Today's Expenses";
    if (dateStr === yesterday) return "Yesterday's Expenses";
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle add expense
  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddExpense({
      date: new Date(),
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      paymentMethod: formData.get('paymentMethod') as string || 'Cash',
      reference: formData.get('reference') as string || '',
    });
    setIsModalOpen(false);
  };

  // Handle update expense
  const handleUpdateExpense = useCallback(async () => {
    if (!editingExpense || !onUpdateExpense) return;
    
    const updateData = {
      category: editingExpense.category,
      amount: Number(editingExpense.amount),
      description: editingExpense.description,
      paymentMethod: editingExpense.paymentMethod,
      reference: editingExpense.reference,
    };
    
    try {
      await onUpdateExpense(editingExpense.id, updateData);
      setEditingExpense(null);
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('Failed to update expense. Please try again.');
    }
  }, [editingExpense, onUpdateExpense]);

  // Handle delete expense
  const handleDeleteExpense = useCallback(async () => {
    if (!expenseToDelete || !onDeleteExpense) return;
    try {
      await onDeleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  }, [expenseToDelete, onDeleteExpense]);

  // Print expense receipt
  const printExpenseReceipt = (expense: Expense) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: monospace; font-size: 12px; width: 280px; padding: 10px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .total { font-size: 16px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center bold">EXPENSE RECEIPT</div>
        <div class="divider"></div>
        <div class="row"><span>Date:</span><span>${new Date(expense.date).toLocaleDateString()}</span></div>
        <div class="row"><span>Category:</span><span>${expense.category}</span></div>
        <div class="divider"></div>
        <div class="bold">${expense.description}</div>
        <div class="divider"></div>
        <div class="row total"><span>AMOUNT:</span><span>${formatCurrency(expense.amount)}</span></div>
        <div class="row"><span>Payment:</span><span>${expense.paymentMethod || 'Cash'}</span></div>
        <div class="divider"></div>
        <div class="center">Expense Recorded</div>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounting & Finance</h1>
          <p className="text-slate-500 text-sm mt-1">Manage expenses, dues, and payments</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase">Revenue</p>
          </div>
          <h3 className="text-xl font-black text-green-600">{formatCurrency(totals.totalSales)}</h3>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase">Payables</p>
          </div>
          <h3 className="text-xl font-black text-orange-600">{formatCurrency(totalSupplierDue)}</h3>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase">Receivables</p>
          </div>
          <h3 className="text-xl font-black text-blue-600">{formatCurrency(totalCustomerDue)}</h3>
        </div>
        
        <div className={`p-4 rounded-2xl shadow-lg ${totals.netProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-bold text-white/70 uppercase">Net Profit</p>
          </div>
          <h3 className="text-xl font-black text-white">{formatCurrency(totals.netProfit)}</h3>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="receivables" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" />
            Customer Dues
            {customerDuesData.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white text-xs">{customerDuesData.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payables" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Truck className="w-4 h-4 mr-2" />
            Supplier Dues
            {supplierDuesData.length > 0 && (
              <Badge className="ml-2 bg-orange-500 text-white text-xs">{supplierDuesData.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Expense Journal
                <span className="ml-auto text-sm font-normal text-slate-400">
                  {expenses.length} records
                </span>
              </h3>
            </div>

            {Object.keys(groupedExpenses).length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No expenses recorded</p>
              </div>
            ) : (
              Object.entries(groupedExpenses).map(([date, data]) => (
                <div key={date}>
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                    <h4 className="font-bold">{formatDate(date)}</h4>
                    <div className="text-right">
                      <span className="text-lg font-black">-{formatCurrency(data.dailyTotal)}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                          <TableHead className="px-4 py-3">Date</TableHead>
                          <TableHead className="px-4 py-3">Category</TableHead>
                          <TableHead className="px-4 py-3">Description</TableHead>
                          <TableHead className="px-4 py-3">Payment</TableHead>
                          <TableHead className="px-4 py-3 text-right">Amount</TableHead>
                          <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.expenses.map(exp => (
                          <TableRow key={exp.id} className="hover:bg-red-50/50">
                            <TableCell className="px-4 py-3 text-sm">
                              {new Date(exp.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${categoryColors[exp.category] || 'bg-slate-100 text-slate-700'}`}>
                                {categoryIcons[exp.category] || '📋'} {exp.category}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm max-w-[200px] truncate">{exp.description}</TableCell>
                            <TableCell className="px-4 py-3 text-sm text-slate-500">{exp.paymentMethod || 'Cash'}</TableCell>
                            <TableCell className="px-4 py-3 text-right font-bold text-red-600">-{formatCurrency(exp.amount)}</TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => setViewingExpense(exp)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded">
                                  <Eye className="w-4 h-4" />
                                </button>
                                {canEdit && (
                                  <button onClick={() => setEditingExpense({ ...exp })} className="p-1.5 text-slate-400 hover:text-amber-600 rounded">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button onClick={() => setExpenseToDelete(exp)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Customer Dues Tab */}
        <TabsContent value="receivables">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Customer Receivables
              </h3>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Due</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalCustomerDue)}</p>
              </div>
            </div>

            {customerDuesData.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No customer dues</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="px-4 py-3">Customer</TableHead>
                    <TableHead className="px-4 py-3">Phone</TableHead>
                    <TableHead className="px-4 py-3 text-right">Due Amount</TableHead>
                    <TableHead className="px-4 py-3 text-right">Total Purchase</TableHead>
                    <TableHead className="px-4 py-3 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerDuesData.map(item => (
                    <TableRow key={item.customer.id}>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {item.customer.name.charAt(0)}
                          </div>
                          <span className="font-medium">{item.customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-500">{item.customer.phone || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(item.totalDue)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{formatCurrency(item.totalSpent)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewCustomerProfile?.(item.customer.id)}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Supplier Dues Tab */}
        <TabsContent value="payables">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                Supplier Payables
              </h3>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Due</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(totalSupplierDue)}</p>
              </div>
            </div>

            {supplierDuesData.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No supplier dues</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="px-4 py-3">Supplier</TableHead>
                    <TableHead className="px-4 py-3">Phone</TableHead>
                    <TableHead className="px-4 py-3 text-right">Balance</TableHead>
                    <TableHead className="px-4 py-3 text-right">Total Purchase</TableHead>
                    <TableHead className="px-4 py-3 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierDuesData.map(item => (
                    <TableRow key={item.supplier.id}>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                            {item.supplier.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium">{item.supplier.name}</span>
                            {'company' in item.supplier && item.supplier.company && (
                              <p className="text-xs text-slate-500">{item.supplier.company}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-500">{item.supplier.contact || item.supplier.phone || '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(item.totalBalance)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{formatCurrency(item.totalAmount)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewSupplierProfile?.(item.supplier.id)}
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <Label>Category</Label>
              {!showNewCategory ? (
                <div className="space-y-2">
                  <select name="category" className="w-full p-3 border rounded-xl mt-1" required>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{categoryIcons[cat] || '📋'} {cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Category
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name..."
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddCustomCategory} className="bg-green-600 hover:bg-green-700">
                      Add
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    ← Back to categories
                  </button>
                </div>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Input name="description" required placeholder="e.g. Electricity Bill - March 2024" className="mt-1" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" step="0.01" name="amount" required placeholder="0.00" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Method</Label>
                <select name="paymentMethod" className="w-full p-3 border rounded-xl mt-1">
                  <option value="Cash">💵 Cash</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="bKash">📱 bKash</option>
                  <option value="Nagad">📱 Nagad</option>
                </select>
              </div>
              <div>
                <Label>Reference</Label>
                <Input name="reference" placeholder="Optional" className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setShowNewCategory(false); setNewCategoryName(''); }}>Cancel</Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Record Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Expense Modal */}
      <Dialog open={!!viewingExpense} onOpenChange={() => setViewingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-red-600">Category</p>
                    <p className="font-bold">{categoryIcons[viewingExpense.category]} {viewingExpense.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600">Amount</p>
                    <p className="text-2xl font-black text-red-600">-{formatCurrency(viewingExpense.amount)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Description</span>
                  <span className="font-medium">{viewingExpense.description}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Payment</span>
                  <span className="font-medium">{viewingExpense.paymentMethod || 'Cash'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium">{new Date(viewingExpense.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => printExpenseReceipt(viewingExpense)} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button onClick={() => { setEditingExpense({ ...viewingExpense }); setViewingExpense(null); }} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <select 
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full p-3 border rounded-xl mt-1"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{categoryIcons[cat] || '📋'} {cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Description</Label>
                <Input 
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input 
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment</Label>
                  <select 
                    value={editingExpense.paymentMethod || 'Cash'}
                    onChange={(e) => setEditingExpense({ ...editingExpense, paymentMethod: e.target.value })}
                    className="w-full p-3 border rounded-xl mt-1"
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="Card">💳 Card</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="bKash">📱 bKash</option>
                    <option value="Nagad">📱 Nagad</option>
                  </select>
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input 
                    value={editingExpense.reference || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, reference: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingExpense(null)}>Cancel</Button>
                <Button onClick={handleUpdateExpense} className="bg-amber-500 hover:bg-amber-600">Save Changes</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Delete Expense?</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-slate-500">{expenseToDelete?.description}</p>
            <p className="text-red-600 font-bold mt-2">-{formatCurrency(expenseToDelete?.amount || 0)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteExpense}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounting;
