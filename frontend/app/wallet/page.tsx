'use client';

import { useState, useEffect } from 'react';
import { getWallet, requestAddMoney, requestWithdraw } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await getWallet();
      setBalance(res.data.balance);
      setTransactions(res.data.transactions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount < 10) {
      setError('Minimum add amount is ₹10');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await requestAddMoney(amount);
      setSuccess('Add money request submitted! Pending admin approval.');
      setShowAddMoney(false);
      setAddAmount('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount) {
      setError('Enter a valid amount');
      return;
    }
    if (!upiId.trim()) {
      setError('Enter your UPI ID');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await requestWithdraw({ amount, upi_id: upiId });
      setSuccess('Withdrawal request submitted! Pending admin approval.');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setUpiId('');
      fetchWallet();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [50, 100, 200, 500];

  return (
    <div className="min-h-screen pb-20 bg-[#0A0A0A]">
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h1 className="font-bold text-white">Wallet 💰</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#FF4500]/20 to-[#FFD700]/10 border border-[#FF4500]/30 rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-1">Total Balance</p>
          <p className="text-4xl font-black gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {loading ? '...' : formatCurrency(balance)}
          </p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { setShowAddMoney(true); setShowWithdraw(false); setError(''); setSuccess(''); }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#FF4500] hover:bg-[#FF6500] text-white rounded-xl py-3 font-bold transition-colors"
            >
              <Plus size={18} /> Add ₹
            </button>
            <button
              onClick={() => { setShowWithdraw(true); setShowAddMoney(false); setError(''); setSuccess(''); }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#141414] border border-[#FFD700] text-[#FFD700] rounded-xl py-3 font-bold transition-colors hover:bg-[#1a1a1a]"
            >
              <Minus size={18} /> Withdraw
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Add Money Form */}
        {showAddMoney && (
          <div className="game-card p-4">
            <h3 className="text-white font-bold mb-3">💰 Add Money</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setAddAmount(String(amount))}
                  className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                    addAmount === String(amount)
                      ? 'bg-[#FF4500] text-white'
                      : 'bg-[#0A0A0A] text-gray-400 hover:text-white border border-[#2a2a2a]'
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Or enter custom amount"
              className="w-full bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF4500] mb-3"
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAddMoney}
                disabled={submitting}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {submitting ? '...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowAddMoney(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
            <p className="text-gray-600 text-xs text-center mt-2">
              Admin approval required (usually within 1 hour)
            </p>
          </div>
        )}

        {/* Withdraw Form */}
        {showWithdraw && (
          <div className="game-card p-4">
            <h3 className="text-white font-bold mb-3">🏦 Withdraw Money</h3>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount (min ₹100)"
              className="w-full bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] mb-3"
            />
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="UPI ID (e.g. name@upi)"
              className="w-full bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] mb-3"
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                {submitting ? '...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 bg-[#141414] border border-[#2a2a2a] text-gray-400 rounded-lg py-3 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h3 className="text-white font-bold mb-3">📋 Transaction History</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="game-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {tx.type === 'credit'
                        ? <TrendingUp size={16} className="text-green-400" />
                        : <TrendingDown size={16} className="text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold line-clamp-1">{tx.description}</p>
                      <p className="text-gray-500 text-xs">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      tx.type === 'credit' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className={`text-xs ${
                      tx.status === 'approved' ? 'text-green-400' :
                      tx.status === 'pending' ? 'text-[#FFD700]' : 'text-red-400'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
