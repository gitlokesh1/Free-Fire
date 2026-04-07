'use client';

import { useState, useEffect } from 'react';
import { getReferrals } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Copy, Share2, Users, Gift } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-10 h-10 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#0A0A0A]">
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h1 className="font-bold text-white">Referral Program 🎁</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Referral Banner */}
        <div className="bg-gradient-to-br from-[#4B0082]/40 to-[#FF4500]/20 border border-purple-500/30 rounded-2xl p-5 text-center">
          <Gift size={32} className="mx-auto text-purple-400 mb-2" />
          <h2 className="text-2xl font-black text-white">Refer & Earn</h2>
          <p className="text-gray-400 text-sm mt-1">
            Invite friends and earn{' '}
            <span className="text-[#FFD700] font-bold">
              {data ? formatCurrency(parseFloat(data.referrer_reward)) : '₹...'} 
            </span>{' '}
            per referral!
          </p>
        </div>

        {/* How it Works */}
        <div className="game-card p-4">
          <h3 className="text-white font-bold mb-3">How it Works</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your referral code with friends', icon: '📤' },
              { step: '2', text: 'Friend signs up using your code', icon: '👤' },
              {
                step: '3',
                text: `You earn ${data ? formatCurrency(parseFloat(data.referrer_reward)) : '₹...'} & friend gets ${data ? formatCurrency(parseFloat(data.new_user_bonus)) : '₹...'}`,
                icon: '💰',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FF4500]/20 border border-[#FF4500] flex items-center justify-center text-[#FF4500] font-bold text-xs flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <p className="text-gray-300 text-sm">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Code */}
        <div className="game-card p-4">
          <p className="text-gray-400 text-sm mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#0A0A0A] border border-[#FFD700]/50 rounded-lg px-4 py-3">
              <p className="text-[#FFD700] font-black text-2xl tracking-widest text-center font-mono">
                {data?.referral_code || '...'}
              </p>
            </div>
            <button
              onClick={copyCode}
              className={`p-3 rounded-lg border transition-all ${
                copied
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-[#2a2a2a] bg-[#141414] text-gray-400 hover:text-white'
              }`}
            >
              <Copy size={20} />
            </button>
          </div>
          {copied && <p className="text-green-400 text-sm text-center mt-2">Copied! ✅</p>}
          <button
            onClick={shareCode}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            SHARE NOW
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="game-card p-4 text-center">
            <p className="text-3xl font-black text-[#FF4500]">
              {data?.referrals.length || 0}
            </p>
            <p className="text-gray-400 text-sm">Total Referrals</p>
          </div>
          <div className="game-card p-4 text-center">
            <p className="text-3xl font-black text-[#FFD700]">
              {data ? formatCurrency(data.total_earned) : '₹0'}
            </p>
            <p className="text-gray-400 text-sm">Total Earned</p>
          </div>
        </div>

        {/* Referral List */}
        <div>
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Users size={16} className="text-[#FF4500]" />
            Your Referrals ({data?.referrals.length || 0})
          </h3>
          {!data?.referrals.length ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="text-gray-500">No referrals yet</p>
              <p className="text-gray-600 text-sm">Share your code to earn!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.referrals.map((ref) => (
                <div key={ref.id} className="game-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Users size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {ref.referred?.ff_name || ref.referred?.name || 'New Player'}
                      </p>
                      <p className="text-gray-500 text-xs">{formatDate(ref.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-sm">
                      +{formatCurrency(ref.reward_amount)}
                    </p>
                    <p className={`text-xs ${
                      ref.status === 'credited' ? 'text-green-400' : 'text-[#FFD700]'
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
