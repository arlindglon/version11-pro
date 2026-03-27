'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, StockAdjustment } from '@/types';
import {
  Search, Plus, Edit, Trash2, Download, Upload, AlertTriangle,
  Package, DollarSign, TrendingDown, TrendingUp, Filter, QrCode, Barcode,
  ArrowUpDown, AlertCircle, BarChart3, FileDown, FileUp, X, Minus, Check,
  History, Calendar, Layers, Image as ImageIcon
} from 'lucide-react';
import RecordHistory from './RecordHistory';
import { formatCurrency, CURRENCY_SYMBOL, useLanguage, MONTHS } from '@/contexts/LanguageContext';
import { ProductImage, ImagePreview } from '@/components/ui/image-preview';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  products: Product[];
  categories: string[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory?: (category: string) => void;
  onDeleteCategory?: (category: string) => void;
  currentUserRole?: string;
  currentUserPermissions?: Record<string, boolean>;
}

const Inventory: React.FC<Props> = ({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  currentUserRole,
  currentUserPermissions,
}) => {
  // Language hook
  const { t, language, isBangla } = useLanguage();
  
  // Permission checks - ONLY Master Admin has full access, all others need explicit permissions
  const isMasterAdmin = currentUserRole === 'Master Admin';
  const canCreate = isMasterAdmin || currentUserPermissions?.inventory_create === true;
  const canEdit = isMasterAdmin || currentUserPermissions?.inventory_edit === true;
  const canDelete = isMasterAdmin || currentUserPermissions?.inventory_delete === true;
  const canAdjust = isMasterAdmin || currentUserPermissions?.inventory_adjust === true;
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [damageQuantity, setDamageQuantity] = useState(1);
  const [damageReason, setDamageReason] = useState('');
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category management state
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  
  // New features state
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [categoryFilterMode, setCategoryFilterMode] = useState<'all' | 'batch' | 'custom'>('all');
  const [selectedBatchCategories, setSelectedBatchCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [activeTab, setActiveTab] = useState<string>('products');
  const [historyActionFilter, setHistoryActionFilter] = useState<string>('all');
  
  // Record History state
  const [historyRecord, setHistoryRecord] = useState<{ type: string; id: string; name: string } | null>(null);
  
  // Inventory history data - fetched from API
  const [inventoryHistory, setInventoryHistory] = useState<StockAdjustment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Fetch inventory history from API
  useEffect(() => {
    const fetchInventoryHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch('/api/stock-adjustments');
        const data = await response.json();
        if (Array.isArray(data)) {
          // Map the data to match StockAdjustment interface with product info
          const historyWithProducts = data.map((item: any) => {
            const product = products.find(p => p.id === item.product_id);
            return {
              id: item.id,
              productId: item.product_id,
              productName: item.product_name || product?.name || 'Unknown Product',
              sku: item.sku || product?.sku || '',
              type: item.adjustment_type || 'adjustment',
              quantity: Math.abs(item.quantity || 0),
              previousStock: item.previous_stock || 0,
              newStock: item.new_stock || 0,
              reason: item.reason || '',
              userName: item.user_name || '',
              createdAt: item.created_at || new Date().toISOString(),
            };
          });
          setInventoryHistory(historyWithProducts);
        }
      } catch (error) {
        console.error('Failed to fetch inventory history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchInventoryHistory();
  }, [products]);

  // Generate QR codes for all products (only in browser)
  useEffect(() => {
    // Skip QR generation during SSR
    if (typeof window === 'undefined') return;
    if (products.length === 0) return;
    
    const generateQRs = async () => {
      const urls: Record<string, string> = {};
      for (const product of products) {
        try {
          // Skip if product doesn't have required data
          if (!product.id) continue;
          const url = await QRCode.toDataURL(product.sku || product.id, {
            margin: 2,
            width: 200,
            color: { dark: '#1e293b', light: '#ffffff' },
          });
          urls[product.id] = url;
        } catch (err) {
          console.error('QR generation error for product:', product.id, err);
        }
      }
      setQrDataUrls(urls);
    };
    generateQRs();
  }, [products]);

  // Auto-generate SKU based on category
  const generateSKU = (category?: string): string => {
    const prefix = (category || 'GEN').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Enhanced category filtering
      let matchesCategory = true;
      if (categoryFilterMode === 'all') {
        matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      } else if (categoryFilterMode === 'batch') {
        matchesCategory = selectedBatchCategories.length === 0 || selectedBatchCategories.includes(p.category);
      } else if (categoryFilterMode === 'custom') {
        matchesCategory = !customCategoryInput || 
          p.category.toLowerCase().includes(customCategoryInput.toLowerCase());
      }
      
      // Month filter
      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const productDate = new Date(p.createdAt);
        matchesMonth = productDate.getMonth() === parseInt(monthFilter);
      }
      
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && p.stock <= p.minStock) ||
        (stockFilter === 'out' && p.stock === 0) ||
        (stockFilter === 'reorder' && p.stock <= p.reorderLevel);
      return matchesSearch && matchesCategory && matchesStock && matchesMonth;
    });
  }, [products, searchTerm, categoryFilter, stockFilter, categoryFilterMode, selectedBatchCategories, customCategoryInput, monthFilter]);

  // Filter history
  const filteredHistory = useMemo(() => {
    return inventoryHistory.filter((h) => {
      // Month filter
      let matchesMonth = true;
      if (monthFilter !== 'all') {
        const historyDate = new Date(h.createdAt);
        matchesMonth = historyDate.getMonth() === parseInt(monthFilter);
      }
      
      // Action filter
      let matchesAction = true;
      if (historyActionFilter !== 'all') {
        matchesAction = h.type === historyActionFilter;
      }
      
      return matchesMonth && matchesAction;
    });
  }, [inventoryHistory, monthFilter, historyActionFilter]);

  // Calculate inventory valuation
  const inventoryStats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
    const totalRetailValue = products.reduce((acc, p) => acc + p.stock * p.salePrice, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.minStock && p.stock > 0).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const reorderCount = products.filter((p) => p.stock <= p.reorderLevel).length;
    const expiringCount = products.filter((p) => {
      if (!p.expiryDate) return false;
      const expiry = new Date(p.expiryDate);
      const today = new Date();
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length;
    const expiredCount = products.filter((p) => {
      if (!p.expiryDate) return false;
      const expiry = new Date(p.expiryDate);
      return expiry < new Date();
    }).length;

    return {
      totalValue,
      totalRetailValue,
      lowStockCount,
      outOfStockCount,
      reorderCount,
      expiringCount,
      expiredCount,
      totalProducts: products.length,
    };
  }, [products]);

  // Get expiry status
  const getExpiryStatus = (date?: Date | string) => {
    if (!date) return { label: 'No Expiry', color: 'bg-slate-100 text-slate-600', urgent: false };
    const expiry = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700', urgent: true };
    if (diffDays <= 7) return { label: `${diffDays}d left`, color: 'bg-red-100 text-red-700', urgent: true };
    if (diffDays <= 30) return { label: `${diffDays}d left`, color: 'bg-orange-100 text-orange-700', urgent: false };
    return { label: expiry.toLocaleDateString(), color: 'bg-green-50 text-green-600', urgent: false };
  };

  // Handle form submission
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as string;
    let sku = formData.get('sku') as string;

    if (autoGenerateSKU && !editingProduct) {
      sku = generateSKU(category);
    }

    const productData = {
      name: formData.get('name') as string,
      sku,
      category,
      unit: formData.get('unit') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      salePrice: Number(formData.get('salePrice')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      reorderLevel: Number(formData.get('reorderLevel')),
      batchNumber: formData.get('batchNumber') as string,
      expiryDate: formData.get('expiryDate') as string,
      imageUrl: formData.get('imageUrl') as string || undefined,
      isActive: true,
      isFeatured: false,
      taxable: false,
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productData);
    } else {
      onAddProduct(productData);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (!selectedProduct) return;
    const previousStock = selectedProduct.stock;
    const newStock =
      adjustmentType === 'increase'
        ? selectedProduct.stock + adjustmentQuantity
        : Math.max(0, selectedProduct.stock - adjustmentQuantity);
    const quantityChange = adjustmentType === 'increase' ? adjustmentQuantity : -adjustmentQuantity;

    // Update the product stock
    onUpdateProduct(selectedProduct.id, { stock: newStock });

    // Record the adjustment for tracking
    try {
      await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          adjustmentType: adjustmentType,
          quantity: quantityChange,
          previousStock: previousStock,
          newStock: newStock,
          reason: adjustmentReason || `${adjustmentType === 'increase' ? 'Stock increase' : 'Stock decrease'}`,
        }),
      });
    } catch (error) {
      console.error('Failed to record stock adjustment:', error);
    }

    setIsAdjustmentModalOpen(false);
    setSelectedProduct(null);
    setAdjustmentQuantity(1);
    setAdjustmentReason('');
  };

  // Handle damage entry
  const handleDamageEntry = async () => {
    if (!selectedProduct) return;
    const previousStock = selectedProduct.stock;
    const newStock = Math.max(0, selectedProduct.stock - damageQuantity);

    // Update the product stock
    onUpdateProduct(selectedProduct.id, { stock: newStock });

    // Record the damage for tracking
    try {
      await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          adjustmentType: 'damage',
          quantity: -damageQuantity,
          previousStock: previousStock,
          newStock: newStock,
          reason: damageReason || 'Damaged goods',
        }),
      });
    } catch (error) {
      console.error('Failed to record damage entry:', error);
    }

    setIsDamageModalOpen(false);
    setSelectedProduct(null);
    setDamageQuantity(1);
    setDamageReason('');
  };

  // Confirm delete product
  const confirmDeleteProduct = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  // Download QR code
  const downloadQR = (productId: string, productName: string) => {
    const url = qrDataUrls[productId];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${productName.replace(/\s+/g, '_')}.png`;
      link.click();
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Purchase Price',
      'Sale Price',
      'Stock',
      'Min Stock',
      'Reorder Level',
      'Unit',
      'Batch Number',
      'Expiry Date',
    ];
    const rows = filteredProducts.map((p) => [
      p.sku,
      p.name,
      p.category,
      p.purchasePrice,
      p.salePrice,
      p.stock,
      p.minStock,
      p.reorderLevel,
      p.unit,
      p.batchNumber || '',
      p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Import from CSV
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header

      lines.forEach((line) => {
        const values = line.split(',');
        if (values.length >= 8 && values[0].trim()) {
          const productData = {
            sku: values[0].trim(),
            name: values[1].trim(),
            category: values[2].trim() || 'Other',
            purchasePrice: parseFloat(values[3]) || 0,
            salePrice: parseFloat(values[4]) || 0,
            stock: 0, // Stock always starts at 0 - must be added through purchases
            minStock: parseInt(values[6]) || 5,
            reorderLevel: parseInt(values[7]) || 10,
            unit: values[8]?.trim() || 'pcs',
            batchNumber: values[9]?.trim() || '',
            expiryDate: values[10]?.trim() || '',
            isActive: true,
            isFeatured: false,
            taxable: false,
          };
          onAddProduct(productData);
        }
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Manage products, track stock, and monitor inventory</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={importFromCSV}
            className="hidden"
          />
          {canCreate && (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setPreviewImageUrl('');
                setIsModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('inventory.add_product')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">Total Value</p>
                <p className="text-lg font-bold">{formatCurrency(inventoryStats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-100">Products</p>
                <p className="text-lg font-bold">{inventoryStats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-orange-100">Low Stock</p>
                <p className="text-lg font-bold">{inventoryStats.lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-rose-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-red-100">Out of Stock</p>
                <p className="text-lg font-bold">{inventoryStats.outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-yellow-100">Reorder</p>
                <p className="text-lg font-bold">{inventoryStats.reorderCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-purple-100">Expiring</p>
                <p className="text-lg font-bold">{inventoryStats.expiringCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Products and History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History ({inventoryHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, SKU, or batch..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="reorder">Reorder Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">SKU / Batch</TableHead>
                  <TableHead className="font-semibold">Stock</TableHead>
                  <TableHead className="font-semibold">Pricing</TableHead>
                  <TableHead className="font-semibold">Expiry</TableHead>
                  <TableHead className="font-semibold">QR</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStock && product.stock > 0;
              const isOutOfStock = product.stock === 0;
              const isReorder = product.stock <= product.reorderLevel;
              const exp = getExpiryStatus(product.expiryDate);

              return (
                <TableRow
                  key={product.id}
                  className={`${isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Product Image with Preview */}
                      <ProductImage product={product} size="lg" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm">{product.sku}</p>
                      {product.batchNumber && (
                        <Badge variant="outline" className="text-xs mt-1">
                          BN: {product.batchNumber}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-lg ${
                          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : ''
                        }`}
                      >
                        {product.stock}
                      </span>
                      <span className="text-slate-400 text-sm">{product.unit}</span>
                    </div>
                    {isOutOfStock && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Out of Stock
                      </Badge>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <Badge variant="outline" className="text-xs mt-1 border-orange-300 text-orange-600">
                        Low Stock (min: {product.minStock})
                      </Badge>
                    )}
                    {isReorder && !isOutOfStock && (
                      <p className="text-xs text-yellow-600 mt-1">Reorder at: {product.reorderLevel}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{formatCurrency(product.salePrice)}</p>
                      <p className="text-xs text-slate-400">Cost: {formatCurrency(product.purchasePrice)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={exp.color}>{exp.label}</Badge>
                    {exp.urgent && (
                      <AlertTriangle className="w-4 h-4 text-red-500 ml-2 inline" />
                    )}
                  </TableCell>
                  <TableCell>
                    {qrDataUrls[product.id] && (
                      <button onClick={() => { setSelectedProduct(product); setIsQRModalOpen(true); }}>
                        <img
                          src={qrDataUrls[product.id]}
                          className="w-10 h-10 rounded border hover:border-blue-500 transition-colors"
                          alt="QR Code"
                        />
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryRecord({ type: 'products', id: product.id, name: product.name })}
                        title="View History"
                        className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      {canAdjust && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setAdjustmentType('increase');
                            setIsAdjustmentModalOpen(true);
                          }}
                          title="Adjust Stock"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </Button>
                      )}
                      {canAdjust && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDamageModalOpen(true);
                          }}
                          title="Damage Entry"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(product);
                            setPreviewImageUrl(product.imageUrl || '');
                            setIsModalOpen(true);
                          }}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadQR(product.id, product.name)}
                        title="Download QR"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProductToDelete(product)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No products found</p>
          </div>
        )}
        </div>
      </TabsContent>

      {/* History Tab */}
      <TabsContent value="history" className="space-y-4">
        {/* History Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Action Type</label>
            <Select value={historyActionFilter} onValueChange={setHistoryActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="increase">Stock Increase</SelectItem>
                <SelectItem value="decrease">Stock Decrease</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="theft">Theft</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Month</label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {MONTHS.filter(m => m.key !== 'all').map((month) => (
                  <SelectItem key={month.key} value={month.key}>
                    {language === 'bn' ? month.bn : month.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoadingHistory ? (
            <div className="text-center py-12 text-slate-500">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No inventory history found</p>
              <p className="text-sm mt-2">Stock adjustments will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Quantity</TableHead>
                  <TableHead className="font-semibold">Stock Change</TableHead>
                  <TableHead className="font-semibold">Reason</TableHead>
                  <TableHead className="font-semibold">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((entry) => {
                  const product = products.find(p => p.id === entry.productId);
                  const actionColors: Record<string, string> = {
                    increase: 'bg-green-100 text-green-700',
                    decrease: 'bg-orange-100 text-orange-700',
                    damage: 'bg-red-100 text-red-700',
                    theft: 'bg-purple-100 text-purple-700',
                    correction: 'bg-blue-100 text-blue-700',
                  };
                  
                  return (
                    <TableRow key={entry.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductImage product={product || { name: entry.productName || 'Unknown', image: undefined }} size="md" />
                          <div>
                            <p className="font-medium text-slate-900">{entry.productName || product?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{entry.sku || product?.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[entry.type] || 'bg-slate-100 text-slate-700'}>
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${entry.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.type === 'increase' ? '+' : '-'}{entry.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{entry.previousStock}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold">{entry.newStock}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 max-w-xs truncate" title={entry.reason}>
                          {entry.reason || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600">{entry.userName || 'System'}</p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>
    </Tabs>

      {/* Add/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Fill in product details'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Category *</Label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Manage Categories
                  </button>
                </div>
                
                {/* Category Manager */}
                {showCategoryManager && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2 space-y-3">
                    {/* Add new category */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="New category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newCategoryName.trim() && onAddCategory) {
                            onAddCategory(newCategoryName.trim());
                            setNewCategoryName('');
                          }
                        }}
                        disabled={!newCategoryName.trim()}
                        className="h-8 px-3"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Category list with delete */}
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {categories.map((cat) => (
                        <div key={cat} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border text-sm">
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteCategory && categories.length > 1) {
                                onDeleteCategory(cat);
                              }
                            }}
                            disabled={categories.length <= 1}
                            className={`p-1 rounded ${categories.length > 1 ? 'text-red-500 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed'}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Select
                  name="category"
                  defaultValue={editingProduct?.category || categories[0]}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    if (autoGenerateSKU && !editingProduct) {
                      const skuInput = document.querySelector('input[name="sku"]') as HTMLInputElement;
                      if (skuInput) {
                        skuInput.value = generateSKU(value);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={editingProduct?.unit || 'pcs'}
                  required
                  placeholder="e.g., pcs, kg, liter"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sku">SKU Code</Label>
                  {!editingProduct && (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={autoGenerateSKU}
                        onChange={(e) => setAutoGenerateSKU(e.target.checked)}
                        className="rounded"
                      />
                      Auto-generate
                    </label>
                  )}
                </div>
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={editingProduct?.sku || (autoGenerateSKU ? generateSKU(categories[0]) : '')}
                  required
                  placeholder="SKU-XXXXXX-XXX"
                  readOnly={autoGenerateSKU && !editingProduct}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  name="batchNumber"
                  defaultValue={editingProduct?.batchNumber}
                  placeholder="e.g., B-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price *</Label>
                <Input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.purchasePrice}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price *</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.salePrice}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Current Stock *</Label>
                {editingProduct ? (
                  <div className="space-y-2">
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      defaultValue={editingProduct?.stock || 0}
                      required
                      placeholder="0"
                      readOnly
                      className="bg-slate-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Stock can only be changed through Purchases
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
                      <span className="text-2xl font-bold text-slate-700">0</span>
                      <span className="text-slate-500 text-sm">(Initial Stock)</span>
                    </div>
                    <input type="hidden" name="stock" value="0" />
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Stock starts at 0. Add purchases to increase stock.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock" className="text-orange-600">
                  Low Stock Alert Level *
                </Label>
                <Input
                  id="minStock"
                  name="minStock"
                  type="number"
                  defaultValue={editingProduct?.minStock || 5}
                  required
                  placeholder="5"
                  className="border-orange-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderLevel" className="text-yellow-600">
                  Reorder Level *
                </Label>
                <Input
                  id="reorderLevel"
                  name="reorderLevel"
                  type="number"
                  defaultValue={editingProduct?.reorderLevel || 10}
                  required
                  placeholder="10"
                  className="border-yellow-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  defaultValue={
                    editingProduct?.expiryDate
                      ? new Date(editingProduct.expiryDate).toISOString().split('T')[0]
                      : ''
                  }
                />
              </div>

              {/* Image URL */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="imageUrl" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product Image URL
                </Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  defaultValue={editingProduct?.imageUrl || ''}
                  placeholder="https://example.com/image.jpg"
                  onChange={(e) => setPreviewImageUrl(e.target.value)}
                />
                <p className="text-xs text-slate-500">Paste image URL from any website (Freepik, Unsplash, etc.)</p>
                {/* Real-time Preview */}
                {(previewImageUrl || editingProduct?.imageUrl) && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border bg-slate-50 flex-shrink-0">
                      <img
                        src={previewImageUrl || editingProduct?.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><path d="M20 5H4V19L13.2923 9.70649C13.6828 9.31595 14.316 9.31591 14.7065 9.70641L20 15.0104V5ZM2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"/></svg>';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600">✓ Image preview</p>
                      <p className="text-xs text-slate-500 truncate">{previewImageUrl || editingProduct?.imageUrl}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingProduct ? 'Update Product' : 'Add Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
            <DialogDescription>
              Adjust stock for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Current Stock</p>
              <p className="text-2xl font-bold">{selectedProduct?.stock} {selectedProduct?.unit}</p>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === 'increase' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustmentType('increase')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> Increase
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === 'decrease' ? 'destructive' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustmentType('decrease')}
                >
                  <TrendingDown className="w-4 h-4 mr-2" /> Decrease
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustQty">Quantity</Label>
              <Input
                id="adjustQty"
                type="number"
                min="1"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustReason">Reason</Label>
              <Input
                id="adjustReason"
                placeholder="e.g., Stock count correction, Received shipment"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">New Stock</p>
              <p className="text-2xl font-bold text-blue-700">
                {adjustmentType === 'increase'
                  ? (selectedProduct?.stock || 0) + adjustmentQuantity
                  : Math.max(0, (selectedProduct?.stock || 0) - adjustmentQuantity)
                } {selectedProduct?.unit}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdjustment}>Confirm Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Damage Entry Modal */}
      <Dialog open={isDamageModalOpen} onOpenChange={setIsDamageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Damage Entry</DialogTitle>
            <DialogDescription>
              Record damaged goods for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-600">Current Stock</p>
              <p className="text-2xl font-bold text-red-700">{selectedProduct?.stock} {selectedProduct?.unit}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="damageQty">Damaged Quantity</Label>
              <Input
                id="damageQty"
                type="number"
                min="1"
                max={selectedProduct?.stock}
                value={damageQuantity}
                onChange={(e) => setDamageQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="damageReason">Damage Reason</Label>
              <Input
                id="damageReason"
                placeholder="e.g., Broken packaging, Expired, Water damage"
                value={damageReason}
                onChange={(e) => setDamageReason(e.target.value)}
              />
            </div>

            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Remaining Stock After Damage</p>
              <p className="text-2xl font-bold">
                {Math.max(0, (selectedProduct?.stock || 0) - damageQuantity)} {selectedProduct?.unit}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDamageModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDamageEntry}>
              Record Damage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Display Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>SKU: {selectedProduct?.sku}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {selectedProduct && qrDataUrls[selectedProduct.id] && (
              <>
                <img
                  src={qrDataUrls[selectedProduct.id]}
                  className="w-48 h-48 rounded-lg border"
                  alt="QR Code"
                />
                <Button
                  onClick={() => downloadQR(selectedProduct.id, selectedProduct.name)}
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Record History Modal */}
      {historyRecord && (
        <RecordHistory
          entityType={historyRecord.type}
          entityId={historyRecord.id}
          entityName={historyRecord.name}
          onClose={() => setHistoryRecord(null)}
        />
      )}
    </div>
  );
};

export default Inventory;
// reload
