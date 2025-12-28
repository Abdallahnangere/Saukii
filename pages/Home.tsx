import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, ArrowRight, ShieldCheck, Phone, RefreshCw, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { Transaction } from '../types';
import { cn, formatCurrency } from '../lib/utils';

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [phone, setPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
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
    <div className="p-6 space-y-8 pb-32">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SAUKI MART</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600 font-semibold text-xs">SM</span>
        </div>
      </header>

      {/* Action Cards */}
      <div className="grid gap-4">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('store')}
          className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg shadow-slate-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Smartphone size={100} />
          </div>
          <div className="relative z-10">
            <Smartphone className="w-8 h-8 mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold mb-1">Buy Devices & SIMs</h3>
            <p className="text-slate-400 text-sm">Premium gadgets delivered</p>
          </div>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('data')}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm cursor-pointer relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wifi size={100} />
          </div>
          <div className="relative z-10">
            <Wifi className="w-8 h-8 mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-1 text-slate-900">Buy Mobile Data</h3>
            <p className="text-slate-500 text-sm">Instant activation, best rates</p>
          </div>
        </motion.div>
      </div>

      {/* Tracking Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Track Transaction</h3>
        <div className="flex gap-2 mb-6">
          <Input 
            placeholder="Enter phone number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button className="w-auto px-4" onClick={handleTrack} isLoading={isLoading}>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-medium text-slate-900 capitalize">{tx.type} Purchase</div>
                  <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                   <div className="font-semibold text-slate-900">{formatCurrency(tx.amount)}</div>
                   <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", getStatusColor(tx.status))}>
                     {tx.status}
                   </span>
                </div>
              </div>
            ))
          ) : (
             <div className="text-center py-8 text-slate-400 text-sm">
               No recent transactions found
             </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-8 pb-4 text-center space-y-6">
        <div className="space-y-2">
            <p className="text-xs text-slate-400">Trusted by SMEDAN • Nigeria</p>
            
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                 <a href="tel:+2349024099561" className="bg-slate-100 rounded-lg p-3 flex items-center justify-center text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                     <Phone className="w-3 h-3 mr-2" /> 09024099561
                 </a>
                 <a href="tel:+2349076872520" className="bg-slate-100 rounded-lg p-3 flex items-center justify-center text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                     <Phone className="w-3 h-3 mr-2" /> 09076872520
                 </a>
                 <a href="mailto:saukidatalinks@gmail.com" className="bg-slate-100 rounded-lg p-3 flex items-center justify-center text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors col-span-2">
                     <Mail className="w-3 h-3 mr-2" /> saukidatalinks@gmail.com
                 </a>
                 <a href="https://wa.me/2349024099561" target="_blank" rel="noreferrer" className="bg-green-50 text-green-700 rounded-lg p-3 flex items-center justify-center text-xs font-medium hover:bg-green-100 transition-colors col-span-2">
                     WhatsApp Support
                 </a>
            </div>
        </div>
      </footer>
    </div>
  );
};