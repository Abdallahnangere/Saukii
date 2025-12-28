import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Transaction } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { Search } from 'lucide-react';

export const Track: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await api.trackTransactions(phone);
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-6 pb-32 min-h-screen">
      <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Track Order</h1>
          <p className="text-slate-500 text-sm mt-1">Check the status of your data or product orders.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 mb-8">
        <div className="space-y-4">
            <Input 
                label="Phone Number"
                className="h-12"
                placeholder="Enter phone number used" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
            />
            <Button onClick={handleTrack} isLoading={isLoading} className="h-12 bg-slate-900">
                <Search className="w-4 h-4 mr-2" />
                Track Now
            </Button>
        </div>
      </div>

      {hasSearched && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Transactions</h3>
            {transactions.length > 0 ? (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                                    {tx.type === 'data' ? 'Data Bundle' : 'Product Order'}
                                    <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", getStatusColor(tx.status))}>
                                        {tx.status}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">Ref: {tx.tx_ref.slice(0, 15)}...</div>
                                <div className="text-xs text-slate-500 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">{formatCurrency(tx.amount)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 text-sm">No transactions found for this number.</p>
                </div>
            )}
          </div>
      )}
    </div>
  );
};