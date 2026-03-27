'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage, formatCurrency } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import {
  Undo2,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Receipt,
  RefreshCw,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { Sale, Product } from '@/types';

interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
}

interface SalesReturnProps {
  sales: Sale[];
  products: Product[];
  onProcessReturn: (returnData: {
    originalSaleId: string;
    items: ReturnItem[];
    refundMethod: 'cash' | 'store_credit' | 'original';
    reason: string;
  }) => Promise<void>;
}

const SalesReturnManager: React.FC<SalesReturnProps> = ({
  sales,
  products,
  onProcessReturn,
}) => {
  const { t } = useLanguage();
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'store_credit' | 'original'>('original');
  const [returnReason, setReturnReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'search' | 'items' | 'confirm'>('search');

  // Find sale by invoice number
  const findSale = useMemo(() => {
    if (!searchInvoice) return null;
    return sales.find(s => 
      s.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      s.id.toLowerCase().includes(searchInvoice.toLowerCase())
    );
  }, [searchInvoice, sales]);

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    // Initialize return items
    const items: ReturnItem[] = sale.items.map(item => ({
      productId: item.productId,
      productName: item.productName || item.name || 'Unknown',
      quantity: 0,
      maxQuantity: item.quantity,
      unitPrice: item.unitPrice || item.price || 0,
      totalPrice: 0,
      reason: '',
    }));
    setReturnItems(items);
    setStep('items');
  };

  const updateReturnQuantity = (productId: string, quantity: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const validQty = Math.min(Math.max(0, quantity), item.maxQuantity);
        return {
          ...item,
          quantity: validQty,
          totalPrice: validQty * item.unitPrice,
        };
      }
      return item;
    }));
  };

  const updateReturnReason = (productId: string, reason: string) => {
    setReturnItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, reason } : item
    ));
  };

  const selectAllItems = () => {
    setReturnItems(prev => prev.map(item => ({
      ...item,
      quantity: item.maxQuantity,
      totalPrice: item.maxQuantity * item.unitPrice,
    })));
  };

  const clearAllItems = () => {
    setReturnItems(prev => prev.map(item => ({
      ...item,
      quantity: 0,
      totalPrice: 0,
    })));
  };

  const totalReturnAmount = returnItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const hasReturnItems = returnItems.some(item => item.quantity > 0);

  const handleProcessReturn = async () => {
    if (!selectedSale || !hasReturnItems) return;

    setIsProcessing(true);
    try {
      const validItems = returnItems.filter(item => item.quantity > 0);
      await onProcessReturn({
        originalSaleId: selectedSale.id,
        items: validItems,
        refundMethod,
        reason: returnReason,
      });
      
      // Reset and close
      setShowReturnModal(false);
      setSelectedSale(null);
      setReturnItems([]);
      setSearchInvoice('');
      setReturnReason('');
      setStep('search');
    } catch (error) {
      console.error('Return processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowReturnModal(true)}
        variant="outline"
        className="border-orange-200 text-orange-700 hover:bg-orange-50"
      >
        <Undo2 className="w-4 h-4 mr-2" />
        Sales Return
      </Button>

      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-orange-500" />
              Process Sales Return
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Search Invoice */}
          {step === 'search' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Search Invoice Number</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchInvoice}
                    onChange={(e) => setSearchInvoice(e.target.value)}
                    placeholder="Enter invoice number..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Found Sales */}
              {findSale && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Invoice Found</span>
                      <Badge className="bg-green-500">
                        {findSale.invoiceNumber}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium">{findSale.customerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">
                          {new Date(findSale.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Amount</p>
                        <p className="font-bold text-lg">{formatCurrency(findSale.total)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment</p>
                        <p className="font-medium">{findSale.paymentMethod}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectSale(findSale)}
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      Select This Invoice
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Recent Sales List */}
              {!findSale && searchInvoice.length > 2 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Recent Sales</p>
                  {sales.slice(0, 5).map(sale => (
                    <button
                      key={sale.id}
                      onClick={() => handleSelectSale(sale)}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{sale.invoiceNumber}</p>
                          <p className="text-sm text-gray-500">{sale.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(sale.total)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Items */}
          {step === 'items' && selectedSale && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Invoice</p>
                  <p className="font-bold">{selectedSale.invoiceNumber}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAllItems}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAllItems}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24 text-center">Max Qty</TableHead>
                      <TableHead className="w-28 text-center">Return Qty</TableHead>
                      <TableHead className="w-24 text-right">Unit Price</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <p className="font-medium">{item.productName}</p>
                          {item.quantity > 0 && (
                            <Input
                              value={item.reason}
                              onChange={(e) => updateReturnReason(item.productId, e.target.value)}
                              placeholder="Reason..."
                              className="mt-1 h-7 text-xs"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{item.maxQuantity}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateReturnQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateReturnQuantity(item.productId, parseInt(e.target.value) || 0)}
                              className="w-14 h-7 text-center"
                              min={0}
                              max={item.maxQuantity}
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateReturnQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxQuantity}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Return Summary */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total Return Amount</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(totalReturnAmount)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>Refund Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'original', label: 'Original Payment', icon: Receipt },
                      { id: 'cash', label: 'Cash Refund', icon: Calculator },
                      { id: 'store_credit', label: 'Store Credit', icon: Package },
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => setRefundMethod(option.id as typeof refundMethod)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          refundMethod === option.id
                            ? 'border-orange-500 bg-orange-100'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <option.icon className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs font-medium">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('search')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={!hasReturnItems}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && selectedSale && (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Confirm Return</p>
                    <p className="text-sm text-amber-700 mt-1">
                      This action will process the return and update inventory. 
                      Please verify all details before confirming.
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Return Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Original Invoice</span>
                    <span className="font-medium">{selectedSale.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items to Return</span>
                    <span className="font-medium">
                      {returnItems.filter(i => i.quantity > 0).length} items
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Quantity</span>
                    <span className="font-medium">
                      {returnItems.reduce((sum, i) => sum + i.quantity, 0)} units
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Refund Method</span>
                    <span className="font-medium capitalize">{refundMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-medium">Refund Amount</span>
                    <span className="text-xl font-bold text-orange-600">
                      {formatCurrency(totalReturnAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Any additional notes about this return..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('items')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleProcessReturn}
                  disabled={isProcessing || !hasReturnItems}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Return
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesReturnManager;
