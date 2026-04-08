'use client';

import { useState, useEffect } from 'react';
import { getReferrals } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Copy, Share2, Users, Gift, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface ReferralData {
  referral_code: string;
  referrals: Referral[];
  total_earned: number;
  referrer_reward: string;
  new_user_bonus: string;
  max_referral_limit: string;
}

interface Referral {
  id: number;
  referred: { phone: string; ff_name: string; name: string };
  reward_amount: number;
  status: string;
  created_at: string;
}

export default function ReferralPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await getReferrals();
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (data?.referral_code) {
      navigator.clipboard.writeText(data.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareCode = () => {
    if (navigator.share && data) {
      navigator.share({
        title: 'BattleZone Arena - Free Fire Tournaments',
        text: `Join BattleZone Arena and win real money playing Free Fire! Use my referral code: ${data.referral_code}`,
        url: window.location.origin,
      });
    } else {
      copyCode();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="font-semibold text-gray-900">Referral Program</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Referral Banner */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Gift size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Refer & Earn</h2>
          <p className="text-indigo-100 text-sm mt-1">
            Invite friends and earn{' '}
            <span className="text-white font-semibold">
              {data ? formatCurrency(parseFloat(data.referrer_reward)) : '₹...'} 
            </span>{' '}
            per referral!
          </p>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-gray-900 font-semibold mb-3">How it Works</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your referral code with friends' },
              { step: '2', text: 'Friend signs up using your code' },
              {
                step: '3',
                text: `You earn ${data ? formatCurrency(parseFloat(data.referrer_reward)) : '₹...'} & friend gets ${data ? formatCurrency(parseFloat(data.new_user_bonus)) : '₹...'}`,
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <p className="text-gray-600 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-gray-500 text-sm mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
              <p className="text-indigo-600 font-bold text-2xl tracking-widest text-center font-mono">
                {data?.referral_code || '...'}
              </p>
            </div>
            <button
              onClick={copyCode}
              className={`p-3 rounded-lg border transition-all ${
                copied
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
          {copied && <p className="text-emerald-600 text-sm text-center mt-2">Copied!</p>}
          <button
            onClick={shareCode}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg w-full mt-3 flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 size={18} />
            Share Now
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">
              {data?.referrals.length || 0}
            </p>
            <p className="text-gray-500 text-sm">Total Referrals</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {data ? formatCurrency(data.total_earned) : '₹0'}
            </p>
            <p className="text-gray-500 text-sm">Total Earned</p>
          </div>
        </div>

        {/* Referral List */}
        <div>
          <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            Your Referrals ({data?.referrals.length || 0})
          </h3>
          {!data?.referrals.length ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No referrals yet</p>
              <p className="text-gray-400 text-sm">Share your code to earn!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.referrals.map((ref) => (
                <div key={ref.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-medium">
                        {ref.referred?.ff_name || ref.referred?.name || 'New Player'}
                      </p>
                      <p className="text-gray-400 text-xs">{formatDate(ref.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-semibold text-sm">
                      +{formatCurrency(ref.reward_amount)}
                    </p>
                    <p className={`text-xs ${
                      ref.status === 'credited' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {ref.status}
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
