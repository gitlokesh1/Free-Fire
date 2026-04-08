'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="font-semibold text-gray-900">Wallet</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Balance Card */}
        <div className="relative rounded-2xl overflow-hidden mb-0">
          <div className="absolute inset-0">
            <Image
              src="/images/walletbg-1dc79077.png"
              alt="Wallet Background"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10 p-6 text-center bg-indigo-600/80">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="relative w-5 h-5">
                <Image src="/images/wallet.png" alt="Wallet" fill className="object-contain invert" />
              </div>
              <p className="text-indigo-200 text-sm">Total Balance</p>
            </div>
            <p className="text-4xl font-bold text-white">
              {loading ? '...' : formatCurrency(balance)}
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowAddMoney(true); setShowWithdraw(false); setError(''); setSuccess(''); }}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-indigo-600 rounded-xl py-3 font-semibold transition-colors hover:bg-indigo-50"
              >
                <Plus size={18} /> Add Money
              </button>
              <button
                onClick={() => { setShowWithdraw(true); setShowAddMoney(false); setError(''); setSuccess(''); }}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-xl py-3 font-semibold transition-colors hover:bg-indigo-400"
              >
                <Minus size={18} /> Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-emerald-700 text-sm">{success}</p>
          </div>
        )}

        {/* Add Money Form */}
        {showAddMoney && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-gray-900 font-semibold mb-3">Add Money</h3>

            {/* Payment Methods */}
            <div className="mb-3">
              <p className="text-gray-500 text-xs mb-2">Pay via</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { src: '/images/Paytm.svg', label: 'Paytm' },
                  { src: '/images/PhonePe.svg', label: 'PhonePe' },
                  { src: '/images/Bank UPI.svg', label: 'Bank UPI' },
                  { src: '/images/Google.svg', label: 'GPay' },
                ].map((pm) => (
                  <div key={pm.label} className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-indigo-300">
                    <div className="relative w-8 h-8">
                      <Image src={pm.src} alt={pm.label} fill className="object-contain" />
                    </div>
                    <span className="text-xs text-gray-500">{pm.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setAddAmount(String(amount))}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    addAmount === String(amount)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAddMoney}
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? '...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowAddMoney(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-gray-400 text-xs text-center mt-2">
              Admin approval required (usually within 1 hour)
            </p>
          </div>
        )}

        {/* Withdraw Form */}
        {showWithdraw && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-gray-900 font-semibold mb-3">Withdraw Money</h3>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount (min ₹100)"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="UPI ID (e.g. name@upi)"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? '...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-3">Transaction History</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'credit'
                        ? <TrendingUp size={16} className="text-emerald-600" />
                        : <TrendingDown size={16} className="text-red-500" />
                      }
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-medium line-clamp-1">{tx.description}</p>
                      <p className="text-gray-400 text-xs">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className={`text-xs ${
                      tx.status === 'approved' ? 'text-emerald-500' :
                      tx.status === 'pending' ? 'text-amber-500' : 'text-red-400'
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
