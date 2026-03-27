'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage, formatCurrency } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Receipt,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Printer,
} from 'lucide-react';

interface CashShift {
  id: string;
  register_id: string;
  user_id: string;
  user_name: string;
  opening_amount: number;
  closing_amount: number | null;
  expected_closing: number | null;
  variance: number | null;
  opened_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
  notes: string | null;
}

interface CashRegister {
  id: string;
  name: string;
  branch_id: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  type: 'open' | 'close' | 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'adjustment';
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface CashRegisterProps {
  branchId?: string;
  userId: string;
  userName: string;
  onShiftChange?: (shift: CashShift | null) => void;
}

const CashRegisterManager: React.FC<CashRegisterProps> = ({
  branchId,
  userId,
  userName,
  onShiftChange,
}) => {
  const { t } = useLanguage();
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [activeShift, setActiveShift] = useState<CashShift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showCashInOut, setShowCashInOut] = useState<'in' | 'out' | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);
  
  // Form states
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNotes, setCashNotes] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [branchId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load registers
      const regRes = await fetch('/api/cash-registers');
      const regData = await regRes.json();
      setRegisters(regData.data || []);

      // Load active shift for current user
      const shiftRes = await fetch(`/api/cash-shifts?userId=${userId}&status=open`);
      const shiftData = await shiftRes.json();
      
      if (shiftData.data?.length > 0) {
        const shift = shiftData.data[0];
        setActiveShift(shift);
        onShiftChange?.(shift);
        
        // Load transactions for this shift
        const transRes = await fetch(`/api/cash-transactions?shiftId=${shift.id}`);
        const transData = await transRes.json();
        setTransactions(transData.data || []);
      } else {
        setActiveShift(null);
        onShiftChange?.(null);
      }
    } catch (error) {
      console.error('Failed to load cash register data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenShift = async () => {
    if (!openingAmount || isNaN(parseFloat(openingAmount))) {
      return;
    }

    try {
      const res = await fetch('/api/cash-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          register_id: registers[0]?.id || 'default',
          user_id: userId,
          user_name: userName,
          opening_amount: parseFloat(openingAmount),
          notes: shiftNotes,
          branch_id: branchId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveShift(data.data);
        onShiftChange?.(data.data);
        setShowOpenShift(false);
        setOpeningAmount('');
        setShiftNotes('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to open shift:', error);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift || !closingAmount) return;

    try {
      const res = await fetch('/api/cash-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          shift_id: activeShift.id,
          closing_amount: parseFloat(closingAmount),
          notes: shiftNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveShift(null);
        onShiftChange?.(null);
        setShowCloseShift(false);
        setClosingAmount('');
        setShiftNotes('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to close shift:', error);
    }
  };

  const handleCashInOut = async () => {
    if (!cashAmount || !activeShift || !showCashInOut) return;

    try {
      const res = await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: activeShift.id,
          register_id: activeShift.register_id,
          transaction_type: showCashInOut === 'in' ? 'cash_in' : 'cash_out',
          amount: parseFloat(cashAmount),
          notes: cashNotes,
          created_by: userId,
        }),
      });

      if (res.ok) {
        setShowCashInOut(null);
        setCashAmount('');
        setCashNotes('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to record transaction:', error);
    }
  };

  // Calculate summary
  const summary = {
    cashSales: transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0),
    refunds: transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0),
    cashIn: transactions
      .filter(t => t.type === 'cash_in')
      .reduce((sum, t) => sum + t.amount, 0),
    cashOut: transactions
      .filter(t => t.type === 'cash_out')
      .reduce((sum, t) => sum + t.amount, 0),
  };

  const expectedClosing = activeShift
    ? activeShift.opening_amount + summary.cashSales - summary.refunds + summary.cashIn - summary.cashOut
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Shift Status */}
      {activeShift ? (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-green-800">Shift Active</CardTitle>
                  <p className="text-sm text-green-600">
                    Started at {new Date(activeShift.opened_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                Open
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="text-xs text-gray-500 font-medium">Opening Balance</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(activeShift.opening_amount)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="text-xs text-gray-500 font-medium">Cash Sales</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(summary.cashSales)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="text-xs text-gray-500 font-medium">Expected</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(expectedClosing)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="text-xs text-gray-500 font-medium">Transactions</p>
                <p className="text-lg font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCashInOut('in')}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <ArrowDownRight className="w-4 h-4 mr-1" />
                Cash In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCashInOut('out')}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Cash Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransactions(true)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCloseShift(true)}
                className="ml-auto"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Close Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Shift</h3>
              <p className="text-slate-500 mb-4">Open a cash register to start accepting payments</p>
              <Button
                onClick={() => setShowOpenShift(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Open Cash Register
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Shift Modal */}
      <Dialog open={showOpenShift} onOpenChange={setShowOpenShift}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-500" />
              Open Cash Register
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Opening Cash Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">
                Count the cash in drawer and enter the total amount
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="Any notes about the opening..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenShift(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOpenShift}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              Open Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Shift Modal */}
      <Dialog open={showCloseShift} onOpenChange={setShowCloseShift}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-500" />
              Close Shift
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Opening Balance</span>
                <span className="font-semibold">{formatCurrency(activeShift?.opening_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cash Sales</span>
                <span className="font-semibold text-green-600">+{formatCurrency(summary.cashSales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Refunds</span>
                <span className="font-semibold text-red-600">-{formatCurrency(summary.refunds)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cash In/Out</span>
                <span className="font-semibold">
                  {summary.cashIn > summary.cashOut ? '+' : ''}{formatCurrency(summary.cashIn - summary.cashOut)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Expected Closing</span>
                <span className="text-blue-600">{formatCurrency(expectedClosing)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actual Cash in Drawer</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>

            {closingAmount && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                Math.abs(parseFloat(closingAmount) - expectedClosing) < 0.01
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {Math.abs(parseFloat(closingAmount) - expectedClosing) < 0.01 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Cash count matches expected amount
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Variance: {formatCurrency(Math.abs(parseFloat(closingAmount) - expectedClosing))}
                    {parseFloat(closingAmount) < expectedClosing ? ' (Short)' : ' (Over)'}
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="Any notes about discrepancies..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseShift(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCloseShift}
              className="bg-gradient-to-r from-orange-500 to-red-500"
            >
              Close Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash In/Out Modal */}
      <Dialog open={!!showCashInOut} onOpenChange={() => setShowCashInOut(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showCashInOut === 'in' ? (
                <>
                  <ArrowDownRight className="w-5 h-5 text-green-500" />
                  Cash In
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5 text-orange-500" />
                  Cash Out
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason / Notes</Label>
              <Input
                value={cashNotes}
                onChange={(e) => setCashNotes(e.target.value)}
                placeholder={showCashInOut === 'in' ? 'e.g., Petty cash deposit' : 'e.g., Expense payment'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCashInOut(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCashInOut}
              className={showCashInOut === 'in' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-orange-500 to-red-500'
              }
            >
              {showCashInOut === 'in' ? 'Add Cash' : 'Remove Cash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Modal */}
      <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-500" />
              Today's Transactions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions yet</p>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      t.type === 'sale' ? 'bg-green-100 text-green-600' :
                      t.type === 'refund' ? 'bg-red-100 text-red-600' :
                      t.type === 'cash_in' ? 'bg-blue-100 text-blue-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {t.type === 'sale' && <TrendingUp className="w-4 h-4" />}
                      {t.type === 'refund' && <TrendingDown className="w-4 h-4" />}
                      {t.type === 'cash_in' && <ArrowDownRight className="w-4 h-4" />}
                      {t.type === 'cash_out' && <ArrowUpRight className="w-4 h-4" />}
                      {t.type === 'open' && <Wallet className="w-4 h-4" />}
                      {t.type === 'close' && <Calculator className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{t.type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{t.notes || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      t.type === 'sale' || t.type === 'cash_in' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'sale' || t.type === 'cash_in' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(t.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashRegisterManager;
