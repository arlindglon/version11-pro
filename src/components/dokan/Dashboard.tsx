'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useLanguage, formatCurrency, CURRENCY_SYMBOL } from '@/contexts/LanguageContext';
import { Sale, Product, Expense, Customer, Supplier, Purchase } from '@/types';
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Users,
  Truck,
  DollarSign,
  Wallet,
  Activity,
  Zap,
  Skull,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ShoppingCart,
  BarChart3,
  Award,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Scan,
  Plus,
  FileText,
  Target,
} from 'lucide-react';

interface Props {
  sales: Sale[];
  purchases: Purchase[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  settings?: {
    shopName?: string;
    shopLogo?: string;
    shopBio?: string;
  } | null;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  trend?: { value: number; isUp: boolean };
  subtitle?: string;
  delay?: number;
  isCount?: boolean; // If true, display as count without currency symbol
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  gradient,
  iconBg,
  trend,
  subtitle,
  delay = 0,
  isCount = false,
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 ${gradient} shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group animate-fadeIn`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Decorative Elements */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 sm:w-12 sm:h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
              trend.isUp ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
            }`}
          >
            {trend.isUp ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
        {title}
      </p>
      <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
        {isCount ? value : (typeof value === 'number' ? formatCurrency(value) : value)}
      </h3>
      {subtitle && (
        <p className="text-white/60 text-xs mt-1.5 font-medium">{subtitle}</p>
      )}
    </div>
  </div>
);

interface ActivityItem {
  id: string;
  type: 'sale' | 'purchase' | 'expense' | 'stock' | 'customer';
  message: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-lg p-4 rounded-xl shadow-2xl border border-slate-100">
        <p className="font-bold text-slate-900 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {CURRENCY_SYMBOL}{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

const Dashboard: React.FC<Props> = ({
  sales = [],
  purchases = [],
  products = [],
  customers = [],
  suppliers = [],
  expenses = [],
  settings,
}) => {
  const { t } = useLanguage();
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);

  // Safe date parser
  const safeDate = (dateValue: unknown): Date | null => {
    if (!dateValue) return null;
    const d = new Date(dateValue as string);
    return isNaN(d.getTime()) ? null : d;
  };

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = (sales || []).filter((s) => {
      const d = safeDate(s.date);
      return d && d.toISOString().startsWith(today);
    });
    const totalSalesToday = todaySales.reduce((acc, s) => acc + s.total, 0);
    const totalCostToday = todaySales.reduce((acc, s) => {
      return (
        acc +
        (s.items || []).reduce((itemAcc, item) => {
          const product = (products || []).find((p) => p.id === item.productId);
          return itemAcc + (product?.purchasePrice || 0) * item.quantity;
        }, 0)
      );
    }, 0);
    const todayProfit = totalSalesToday - totalCostToday;

    return { totalSalesToday, todayProfit, todayTransactions: todaySales.length };
  }, [sales, products]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySales = (sales || []).filter((s) => {
      const d = safeDate(s.date);
      return d && d >= firstDayOfMonth;
    });
    const monthlyRevenue = monthlySales.reduce((acc, s) => acc + s.total, 0);
    const monthlyExpenses = (expenses || [])
      .filter((e) => {
        const d = safeDate(e.date);
        return d && d >= firstDayOfMonth;
      })
      .reduce((acc, e) => acc + e.amount, 0);
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    return { monthlyRevenue, monthlyExpenses, monthlyProfit, monthlyTransactions: monthlySales.length };
  }, [sales, expenses]);

  // Calculate inventory stats
  const inventoryStats = useMemo(() => {
    const stockValue = (products || []).reduce(
      (acc, p) => acc + p.stock * p.purchasePrice,
      0
    );
    const lowStockCount = (products || []).filter((p) => p.stock <= p.minStock).length;
    const outOfStockCount = (products || []).filter((p) => p.stock === 0).length;

    return { stockValue, lowStockCount, outOfStockCount };
  }, [products]);

  // Calculate people stats - from actual sales/purchases, not stored values
  const peopleStats = useMemo(() => {
    const totalCustomers = (customers || []).length;
    const totalSuppliers = (suppliers || []).length;

    // Calculate total receivables from actual sales dues
    const totalReceivables = (sales || []).reduce((acc, sale) => acc + (sale.due || 0), 0);

    // Calculate total payables from actual purchase balances
    const totalPayables = (purchases || []).reduce((acc, purchase) => acc + (purchase.balance || 0), 0);

    return { totalCustomers, totalSuppliers, totalReceivables, totalPayables };
  }, [customers, suppliers, sales, purchases]);

  // Calculate sales trend data
  const salesTrendData = useMemo(() => {
    const days = chartPeriod;
    return [...Array(days)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      const daySales = (sales || []).filter((s) => {
        const sd = safeDate(s.date);
        return sd && sd.toISOString().startsWith(dateStr);
      });
      const dayPurchases = (purchases || []).filter((p) => {
        const pd = safeDate(p.date);
        return pd && pd.toISOString().startsWith(dateStr);
      });
      return {
        name:
          days === 7
            ? d.toLocaleDateString(undefined, { weekday: 'short' })
            : d.getDate().toString(),
        sales: daySales.reduce((acc, s) => acc + s.total, 0),
        purchases: dayPurchases.reduce((acc, p) => acc + p.total, 0),
        profit: daySales.reduce((acc, s) => acc + s.total, 0) - dayPurchases.reduce((acc, p) => acc + p.total, 0),
      };
    });
  }, [sales, purchases, chartPeriod]);

  // Calculate top products by sales
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    (sales || []).forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName || (products || []).find(p => p.id === item.productId)?.name || 'Unknown',
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice;
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [sales, products]);

  // Calculate fast moving products
  const fastMovingProducts = useMemo(() => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentProductSales: Record<string, { name: string; quantity: number }> = {};
    
    (sales || [])
      .filter((s) => {
        const sd = safeDate(s.date);
        return sd && sd >= last7Days;
      })
      .forEach((sale) => {
        (sale.items || []).forEach((item) => {
          if (!recentProductSales[item.productId]) {
            recentProductSales[item.productId] = {
              name: item.productName || (products || []).find(p => p.id === item.productId)?.name || 'Unknown',
              quantity: 0,
            };
          }
          recentProductSales[item.productId].quantity += item.quantity;
        });
      });

    return Object.entries(recentProductSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [sales, products]);

  // Calculate dead stock
  const deadStock = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const soldProductIds = new Set<string>();
    
    (sales || [])
      .filter((s) => {
        const sd = safeDate(s.date);
        return sd && sd >= last30Days;
      })
      .forEach((sale) => {
        (sale.items || []).forEach((item) => {
          soldProductIds.add(item.productId);
        });
      });

    return (products || [])
      .filter((p) => !soldProductIds.has(p.id) && p.stock > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        value: p.stock * p.purchasePrice,
      }))
      .slice(0, 10);
  }, [sales, products]);

  // Generate recent activities
  const recentActivities = useMemo(() => {
    const activities: ActivityItem[] = [];

    (sales || [])
      .slice(-5)
      .reverse()
      .forEach((sale) => {
        const saleDate = safeDate(sale.createdAt || sale.date);
        activities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          message: `Sale of ${CURRENCY_SYMBOL}${(sale.total || 0).toFixed(2)} to ${sale.customerName || 'Customer'}`,
          time: saleDate ? saleDate.toLocaleString() : 'Unknown',
          icon: <ShoppingCart className="w-4 h-4" />,
          color: 'text-green-600 bg-green-100',
        });
      });

    (purchases || [])
      .slice(-3)
      .reverse()
      .forEach((purchase) => {
        const purchaseDate = safeDate(purchase.createdAt || purchase.date);
        activities.push({
          id: `purchase-${purchase.id}`,
          type: 'purchase',
          message: `Purchase of ${CURRENCY_SYMBOL}${(purchase.total || 0).toFixed(2)} from ${purchase.supplierName || 'Supplier'}`,
          time: purchaseDate ? purchaseDate.toLocaleString() : 'Unknown',
          icon: <Truck className="w-4 h-4" />,
          color: 'text-blue-600 bg-blue-100',
        });
      });

    (expenses || [])
      .slice(-2)
      .reverse()
      .forEach((expense) => {
        const expenseDate = safeDate(expense.createdAt || expense.date);
        activities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          message: `Expense: ${expense.category || 'General'} - ${CURRENCY_SYMBOL}${(expense.amount || 0).toFixed(2)}`,
          time: expenseDate ? expenseDate.toLocaleString() : 'Unknown',
          icon: <Wallet className="w-4 h-4" />,
          color: 'text-red-600 bg-red-100',
        });
      });

    return activities
      .sort((a, b) => {
        const dateA = safeDate(a.time);
        const dateB = safeDate(b.time);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);
  }, [sales, purchases, expenses]);

  // Pie chart data for category distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {settings?.shopLogo ? (
                  <img 
                    src={settings.shopLogo} 
                    alt={settings.shopName || 'Shop'} 
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain shadow-xl"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse-slow">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                    {t('dashboard.welcome')}
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-base font-medium mt-0.5">
                    {t('dashboard.subtitle')}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Date */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-green-300">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Quick Stats - Primary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatCard
              title={t('dashboard.today_sales')}
              value={todayStats.totalSalesToday.toFixed(2)}
              icon={<DollarSign className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
              iconBg="bg-white/20"
              trend={{ value: 12.5, isUp: true }}
              subtitle={`${todayStats.todayTransactions} ${t('dashboard.transactions')}`}
              delay={0}
            />
            <StatCard
              title={t('dashboard.today_profit')}
              value={todayStats.todayProfit.toFixed(2)}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600"
              iconBg="bg-white/20"
              trend={{ value: 8.3, isUp: true }}
              delay={100}
            />
            <StatCard
              title={t('dashboard.monthly_revenue')}
              value={monthlyStats.monthlyRevenue.toFixed(2)}
              icon={<BarChart3 className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
              iconBg="bg-white/20"
              trend={{ value: 5.2, isUp: true }}
              subtitle={`${monthlyStats.monthlyTransactions} ${t('dashboard.orders')}`}
              delay={200}
            />
            <StatCard
              title={t('dashboard.net_profit')}
              value={monthlyStats.monthlyProfit.toFixed(2)}
              icon={<Target className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
              iconBg="bg-white/20"
              subtitle={`${t('accounting.total_expenses')}: ${CURRENCY_SYMBOL}${monthlyStats.monthlyExpenses.toFixed(0)}`}
              delay={300}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatCard
              title={t('dashboard.inventory_value')}
              value={inventoryStats.stockValue.toFixed(2)}
              icon={<Package className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600"
              iconBg="bg-white/20"
              subtitle={`${products.length} ${t('dashboard.products')}`}
              delay={400}
            />
            <StatCard
              title={t('dashboard.low_stock')}
              value={inventoryStats.lowStockCount}
              icon={<AlertTriangle className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-red-500 via-rose-500 to-pink-600"
              iconBg="bg-white/20"
              subtitle={`${inventoryStats.outOfStockCount} ${t('dashboard.out_of_stock')}`}
              delay={500}
              isCount={true}
            />
            <StatCard
              title="Customer Due"
              value={peopleStats.totalReceivables.toFixed(2)}
              icon={<Users className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600"
              iconBg="bg-white/20"
              subtitle={`${peopleStats.totalCustomers} customers`}
              delay={600}
            />
            <StatCard
              title="Supplier Due"
              value={peopleStats.totalPayables.toFixed(2)}
              icon={<Truck className="w-6 h-6 text-white" />}
              gradient="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600"
              iconBg="bg-white/20"
              subtitle={`${peopleStats.totalSuppliers} suppliers`}
              delay={700}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Sales Trend Chart - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-100/50 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{t('dashboard.sales_trend')}</h3>
                    <p className="text-slate-500 text-sm">{t('reports.overview')}</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 rounded-xl p-1 self-start">
                  <button
                    onClick={() => setChartPeriod(7)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      chartPeriod === 7
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    7 {t('dashboard.days')}
                  </button>
                  <button
                    onClick={() => setChartPeriod(30)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      chartPeriod === 30
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    30 {t('dashboard.days')}
                  </button>
                </div>
              </div>
              
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="colorSalesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPurchasesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                      tickFormatter={(value) => `${CURRENCY_SYMBOL}${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSalesGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="purchases"
                      name="Purchases"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPurchasesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center gap-6 sm:gap-8 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500" />
                  <span className="text-sm font-semibold text-slate-600">{t('common.sales')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                  <span className="text-sm font-semibold text-slate-600">{t('common.purchases')}</span>
                </div>
              </div>
            </div>

            {/* Top Products - Takes 1 column */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-100/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('dashboard.top_products')}</h3>
                  <p className="text-slate-500 text-xs">{t('reports.overview')}</p>
                </div>
              </div>
              
              <div className="h-[220px] sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      width={70}
                      tickFormatter={(value) => value.length > 8 ? `${value.slice(0, 8)}...` : value}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${CURRENCY_SYMBOL}${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {topProducts.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Fast Moving Products */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-100/50">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('dashboard.fast_moving')}</h3>
                  <p className="text-slate-500 text-xs">{t('reports.this_week')}</p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3 max-h-[220px] sm:max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {fastMovingProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-transparent rounded-xl hover:from-green-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <span className="font-semibold text-slate-800 text-sm truncate max-w-[100px] sm:max-w-[120px]">
                        {product.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      {product.quantity} {t('dashboard.sold')}
                    </span>
                  </div>
                ))}
                {fastMovingProducts.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('dashboard.no_recent_data')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dead Stock Alert */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-100/50">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Skull className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('dashboard.dead_stock')}</h3>
                  <p className="text-slate-500 text-xs">{t('dashboard.zero_sales')}</p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3 max-h-[220px] sm:max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {deadStock.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-transparent rounded-xl border border-red-100 hover:from-red-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Stock: {product.stock} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(product.value)}
                      </p>
                      <p className="text-xs text-slate-400">{t('dashboard.locked')}</p>
                    </div>
                  </div>
                ))}
                {deadStock.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('dashboard.no_dead_stock')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl text-white">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{t('dashboard.recent_activity')}</h3>
                    <p className="text-slate-400 text-xs">{t('dashboard.live')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-semibold">Live</span>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3 max-h-[220px] sm:max-h-[250px] overflow-y-auto pr-2 custom-scrollbar-dark">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <p className="text-xs text-slate-500">
                          {activity.time === 'Unknown' ? 'Unknown' : (() => {
                            const d = safeDate(activity.time);
                            return d ? d.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'Unknown';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('dashboard.no_activity')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
