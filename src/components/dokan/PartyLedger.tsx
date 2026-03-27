'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage, formatCurrency } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Calendar,
  FileText,
  User,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Printer,
  Download,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { Customer, Supplier, Sale, Purchase } from '@/types';

interface LedgerEntry {
  id: string;
  date: string;
  type: 'sale' | 'payment' | 'adjustment' | 'purchase' | 'opening';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface CustomerLedgerProps {
  type: 'customer' | 'supplier';
  data: Customer[] | Supplier[];
  sales?: Sale[];
  purchases?: Purchase[];
  onRecordPayment: (payment: {
    partyId: string;
    amount: number;
    method: string;
    reference: string;
    notes: string;
  }) => Promise<void>;
}

const PartyLedger: React.FC<CustomerLedgerProps> = ({
  type,
  data,
  sales = [],
  purchases = [],
  onRecordPayment,
}) => {
  const { t } = useLanguage();
  const [selectedParty, setSelectedParty] = useState<Customer | Supplier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Generate ledger entries for selected party
  const ledgerEntries = useMemo((): LedgerEntry[] => {
    if (!selectedParty) return [];

    const entries: LedgerEntry[] = [];
    let runningBalance = 0;
    const partyId = selectedParty.id;

    if (type === 'customer') {
      // Opening balance (initial due)
      const customer = selectedParty as Customer;
      if (customer.due > 0) {
        entries.push({
          id: 'opening',
          date: new Date().toISOString().split('T')[0],
          type: 'opening',
          reference: '-',
          description: 'Opening Balance',
          debit: customer.due,
          credit: 0,
          balance: customer.due,
        });
        runningBalance = customer.due;
      }

      // Add sales
      const customerSales = sales.filter(s => s.customerId === partyId);
      customerSales.forEach(sale => {
        const amount = sale.total - sale.paid; // Only the due amount
        if (amount > 0) {
          runningBalance += amount;
          entries.push({
            id: sale.id,
            date: new Date(sale.date).toISOString().split('T')[0],
            type: 'sale',
            reference: sale.invoiceNumber,
            description: `Sale - ${sale.invoiceNumber}`,
            debit: amount,
            credit: 0,
            balance: runningBalance,
          });
        }
      });
    } else {
      // Supplier
      const supplier = selectedParty as Supplier;
      if (supplier.balance > 0) {
        entries.push({
          id: 'opening',
          date: new Date().toISOString().split('T')[0],
          type: 'opening',
          reference: '-',
          description: 'Opening Balance',
          debit: 0,
          credit: supplier.balance,
          balance: supplier.balance,
        });
        runningBalance = supplier.balance;
      }

      // Add purchases
      const supplierPurchases = purchases.filter(p => p.supplierId === partyId);
      supplierPurchases.forEach(purchase => {
        const amount = purchase.total - purchase.paid;
        if (amount > 0) {
          runningBalance += amount;
          entries.push({
            id: purchase.id,
            date: new Date(purchase.date).toISOString().split('T')[0],
            type: 'purchase',
            reference: purchase.purchaseNumber,
            description: `Purchase - ${purchase.purchaseNumber}`,
            debit: 0,
            credit: amount,
            balance: runningBalance,
          });
        }
      });
    }

    // Sort by date
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedParty, sales, purchases, type]);

  const handleOpenPayment = (party: Customer | Supplier) => {
    setSelectedParty(party);
    setShowPaymentModal(true);
    // Set default amount to full due
    const due = type === 'customer' 
      ? (party as Customer).due 
      : (party as Supplier).balance;
    setPaymentAmount(due.toString());
  };

  const handleOpenLedger = (party: Customer | Supplier) => {
    setSelectedParty(party);
    setShowLedgerModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedParty || !paymentAmount) return;

    setIsProcessing(true);
    try {
      await onRecordPayment({
        partyId: selectedParty.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        reference: paymentReference,
        notes: paymentNotes,
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethod('Cash');
      setPaymentReference('');
      setPaymentNotes('');
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalDue = data.reduce((sum, party) => {
    return sum + (type === 'customer' 
      ? (party as Customer).due 
      : (party as Supplier).balance);
  }, 0);

  const filteredData = useMemo(() => {
    return data.filter(party => {
      const due = type === 'customer' 
        ? (party as Customer).due 
        : (party as Supplier).balance;
      return due > 0;
    }).sort((a, b) => {
      const dueA = type === 'customer' ? (a as Customer).due : (a as Supplier).balance;
      const dueB = type === 'customer' ? (b as Customer).due : (b as Supplier).balance;
      return dueB - dueA;
    });
  }, [data, type]);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">
                  Total {type === 'customer' ? 'Receivables' : 'Payables'}
                </p>
                <p className="text-2xl font-bold">{formatCurrency(totalDue)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">
                {filteredData.length} parties with dues
              </p>
              <p className="text-sm text-slate-500">
                of {data.length} total {type}s
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Party List */}
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Due Amount</TableHead>
              <TableHead className="text-right">Total Purchase</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No dues to display
                </TableCell>
              </TableRow>
            ) : (
              filteredData.slice(0, 10).map((party) => {
                const customer = party as Customer;
                const supplier = party as Supplier;
                const due = type === 'customer' ? customer.due : supplier.balance;
                const totalPurchase = type === 'customer' ? customer.totalPurchase : supplier.totalPurchase;

                return (
                  <TableRow key={party.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {party.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{party.name}</p>
                          {type === 'supplier' && supplier.company && (
                            <p className="text-xs text-gray-500">{supplier.company}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{party.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-red-600">{formatCurrency(due)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalPurchase || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenLedger(party)}
                          title="View Ledger"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPayment(party)}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Payment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Record {type === 'customer' ? 'Collection' : 'Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                  {selectedParty?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedParty?.name}</p>
                  <p className="text-sm text-gray-500">{selectedParty?.phone}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">Current Due</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(
                    type === 'customer' 
                      ? (selectedParty as Customer)?.due 
                      : (selectedParty as Supplier)?.balance
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaymentAmount('')}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const due = type === 'customer' 
                      ? (selectedParty as Customer)?.due 
                      : (selectedParty as Supplier)?.balance;
                    setPaymentAmount(due.toString());
                  }}
                >
                  Full Amount
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID / Cheque number..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={isProcessing || !paymentAmount}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ledger Modal */}
      <Dialog open={showLedgerModal} onOpenChange={setShowLedgerModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                {selectedParty?.name} - Ledger
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs text-gray-500">Total Debit</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(ledgerEntries.reduce((sum, e) => sum + e.debit, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs text-gray-500">Total Credit</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(ledgerEntries.reduce((sum, e) => sum + e.credit, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs text-gray-500">Current Balance</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(ledgerEntries[ledgerEntries.length - 1]?.balance || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ledger Table */}
            {ledgerEntries.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">
                          {new Date(entry.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.type === 'sale' && <TrendingUp className="w-4 h-4 text-red-500" />}
                            {entry.type === 'payment' && <TrendingDown className="w-4 h-4 text-green-500" />}
                            {entry.type === 'purchase' && <TrendingUp className="w-4 h-4 text-red-500" />}
                            {entry.type === 'opening' && <Calendar className="w-4 h-4 text-gray-500" />}
                            <div>
                              <p className="text-sm">{entry.description}</p>
                              <p className="text-xs text-gray-500">{entry.reference}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0 && (
                            <span className="text-red-600 font-medium">
                              {formatCurrency(entry.debit)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 && (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(entry.credit)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartyLedger;
