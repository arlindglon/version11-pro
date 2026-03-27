'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Package,
  Building2,
  Filter,
  Send,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  toBranchId: string;
  fromBranchName?: string;
  toBranchName?: string;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled' | 'rejected';
  notes?: string;
  items: TransferItem[];
  createdAt: string;
}

interface TransferItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  receivedQuantity: number;
}

interface Props {
  branches: Branch[];
  products: Product[];
  currentUserRole?: string;
  currentBranchId?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" /> },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: <Truck className="w-4 h-4" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> },
};

export default function StockTransferComponent({ 
  branches, 
  products, 
  currentUserRole,
  currentBranchId 
}: Props) {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fromBranchId: currentBranchId || '',
    toBranchId: '',
    notes: '',
    items: [{ productId: '', quantity: 1 }],
  });

  const canCreate = currentUserRole === 'Admin' || currentUserRole === 'Manager';
  const canApprove = currentUserRole === 'Admin';

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock-transfers');
      const data = await res.json();
      setTransfers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleCreateTransfer = async () => {
    if (!formData.fromBranchId || !formData.toBranchId) {
      alert('Please select both branches');
      return;
    }

    if (formData.fromBranchId === formData.toBranchId) {
      alert('Source and destination branches must be different');
      return;
    }

    const validItems = formData.items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromBranchId: formData.fromBranchId,
          toBranchId: formData.toBranchId,
          notes: formData.notes,
          items: validItems,
        }),
      });

      if (res.ok) {
        setShowDialog(false);
        setFormData({
          fromBranchId: currentBranchId || '',
          toBranchId: '',
          notes: '',
          items: [{ productId: '', quantity: 1 }],
        });
        fetchTransfers();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to create transfer');
      }
    } catch (error) {
      console.error('Failed to create transfer:', error);
      alert('Failed to create transfer');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/stock-transfers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTransfers();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromBranchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toBranchName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getBranchName = (id: string) => {
    return branches.find(b => b.id === id)?.name || id;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-7 h-7 text-blue-600" />
            Stock Transfers
          </h2>
          <p className="text-slate-500 mt-1">Transfer stock between branches</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Transfer
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = transfers.filter(t => t.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`${config.color} p-2 rounded-lg`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{config.label}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search transfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <SelectItem key={status} value={status}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transfers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No stock transfers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer #</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.transferNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {transfer.fromBranchName || getBranchName(transfer.fromBranchId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {transfer.toBranchName || getBranchName(transfer.toBranchId)}
                    </div>
                  </TableCell>
                  <TableCell>{transfer.items?.length || 0} items</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[transfer.status]?.color}>
                      {statusConfig[transfer.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(transfer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTransfer(transfer);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canApprove && transfer.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() => handleUpdateStatus(transfer.id, 'approved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleUpdateStatus(transfer.id, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Transfer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Stock Transfer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Branch</Label>
                <Select
                  value={formData.fromBranchId}
                  onValueChange={(v) => setFormData({ ...formData, fromBranchId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Branch</Label>
                <Select
                  value={formData.toBranchId}
                  onValueChange={(v) => setFormData({ ...formData, toBranchId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.id !== formData.fromBranchId).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items</Label>
              <div className="border rounded-lg p-4 space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={item.productId}
                      onValueChange={(v) => handleItemChange(index, 'productId', v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (Stock: {product.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-24"
                      placeholder="Qty"
                    />
                    {formData.items.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransfer} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Creating...' : 'Create Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Transfer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Transfer Number</p>
                  <p className="font-medium">{selectedTransfer.transferNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={statusConfig[selectedTransfer.status]?.color}>
                    {statusConfig[selectedTransfer.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">From Branch</p>
                  <p className="font-medium">{selectedTransfer.fromBranchName || getBranchName(selectedTransfer.fromBranchId)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">To Branch</p>
                  <p className="font-medium">{selectedTransfer.toBranchName || getBranchName(selectedTransfer.toBranchId)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Items</p>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransfer.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName || 'Unknown'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.receivedQuantity || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-sm">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
