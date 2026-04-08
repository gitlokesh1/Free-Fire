'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, Trophy, Zap, Shield } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import MatchCard from '@/components/MatchCard';
import { getMatches } from '@/lib/api';
import { getUser, isLoggedIn } from '@/lib/utils';

interface Match {
  id: number;
  title: string;
  type: string;
  entry_fee: number;
  per_kill_reward: number;
  max_players: number;
  map: string;
  status: string;
  scheduled_at: string;
  participant_count: number;
}

const banners = [
  {
    title: 'Mega Tournament',
    subtitle: 'Win up to ₹10,000',
    desc: '50 Players • Per Kill ₹5 • Solo',
    bg: 'bg-indigo-600',
  },
  {
    title: 'Daily Battles',
    subtitle: 'Join & Earn Daily',
    desc: 'Multiple matches every day',
    bg: 'bg-emerald-600',
  },
  {
    title: 'Squad Wars',
    subtitle: 'Team up & Dominate',
    desc: '4v4 Squad matches available',
    bg: 'bg-violet-600',
  },
];

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const user = getUser();

  useEffect(() => {
    if (isLoggedIn()) {
      fetchMatches();
    } else {
      setLoading(false);
    }

    const interval = setInterval(() => {
      setBannerIdx((i) => (i + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await getMatches();
      setMatches(res.data.matches || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <div className="mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            BattleZone Arena
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Free Fire Tournament Platform</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
          {[
            { icon: Trophy, label: 'Win Cash', bg: 'bg-amber-50', color: 'text-amber-600' },
            { icon: Zap, label: 'Per Kill ₹', bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { icon: Shield, label: 'Secure', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          ].map(({ icon: Icon, label, bg, color }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
              <Icon size={24} className={`${color} mx-auto mb-1`} />
              <p className="text-xs text-gray-600 font-medium">{label}</p>
            </div>
          ))}
        </div>

        <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg w-full max-w-sm text-center block transition-colors">
          Login / Sign Up
        </Link>
        <p className="text-gray-400 text-xs mt-4">Phone OTP • Instant • Secure</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">BattleZone</h1>
              {user && (
                <p className="text-xs text-gray-400">
                  Hi, {user.name || user.phone?.slice(-4) || 'Player'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
            </button>
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Banner Slider */}
        <div className="relative mb-6 overflow-hidden rounded-xl">
          <div className={`${banners[bannerIdx].bg} rounded-xl min-h-[130px] flex flex-col justify-center transition-all duration-500 p-6`}>
            <h2 className="text-xl font-bold text-white mb-1">{banners[bannerIdx].title}</h2>
            <p className="text-white/90 font-semibold">{banners[bannerIdx].subtitle}</p>
            <p className="text-white/75 text-sm mt-1">{banners[bannerIdx].desc}</p>
          </div>
          {/* Dots */}
          <div className="flex gap-1.5 justify-center mt-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === bannerIdx ? 'bg-indigo-600 w-6' : 'bg-gray-300 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        {user && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between shadow-sm">
            <div className="text-center">
              <p className="text-indigo-600 font-bold text-lg">₹{user.wallet_balance || 0}</p>
              <p className="text-gray-400 text-xs">Wallet</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <p className={`font-bold text-lg ${user.ff_uid ? 'text-emerald-500' : 'text-red-400'}`}>
                {user.ff_uid ? 'Linked' : 'Not Set'}
              </p>
              <p className="text-gray-400 text-xs">UID Status</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <Link href="/wallet">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors">
                Add ₹
              </button>
            </Link>
          </div>
        )}

        {/* UID Bind Alert */}
        {user && !user.ff_uid && (
          <Link href="/bind-uid">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-amber-700 font-semibold text-sm">Bind Your Free Fire UID</p>
                <p className="text-amber-600 text-xs">Required to join matches</p>
              </div>
              <ChevronRight size={16} className="text-amber-500" />
            </div>
          </Link>
        )}

        {/* Live Matches */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Live Matches</h2>
          <Link href="/matches" className="text-indigo-600 text-sm font-medium">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Trophy size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No matches available right now</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                participantCount={match.participant_count || 0}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
