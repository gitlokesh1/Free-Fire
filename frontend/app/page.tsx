'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ChevronLeft, ChevronRight, Trophy, Zap, Shield } from 'lucide-react';
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
    title: '🏆 MEGA TOURNAMENT',
    subtitle: 'Win up to ₹10,000',
    desc: '50 Players • Per Kill ₹5 • Solo',
    gradient: 'from-[#FF4500] to-[#8B0000]',
  },
  {
    title: '⚡ DAILY BATTLES',
    subtitle: 'Join & Earn Daily',
    desc: 'Multiple matches every day',
    gradient: 'from-[#FFD700] to-[#FF8C00]',
  },
  {
    title: '🔥 SQUAD WARS',
    subtitle: 'Team up & Dominate',
    desc: '4v4 Squad matches available',
    gradient: 'from-[#4B0082] to-[#FF4500]',
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8 animate-float">
          <div className="text-6xl mb-4">🔥</div>
          <h1 className="text-4xl font-black gradient-text tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            BATTLEZONE
          </h1>
          <h2 className="text-2xl font-bold text-[#FFD700]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            ARENA
          </h2>
          <p className="text-gray-400 mt-2 text-sm">Free Fire Tournament Platform</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
          {[
            { icon: Trophy, label: 'Win Cash', color: '#FFD700' },
            { icon: Zap, label: 'Per Kill ₹', color: '#FF4500' },
            { icon: Shield, label: 'Secure', color: '#64C864' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="game-card p-3 text-center">
              <Icon size={24} className="mx-auto mb-1" style={{ color }} />
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <Link href="/login" className="btn-primary w-full max-w-sm text-center block animate-pulse-glow">
          LOGIN / SIGNUP 🔥
        </Link>
        <p className="text-gray-600 text-xs mt-4">Phone OTP • Instant • Secure</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              BATTLEZONE 🔥
            </h1>
            {user && (
              <p className="text-xs text-gray-500">
                Welcome, {user.name || user.phone?.slice(-4) || 'Player'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FFD700] flex items-center justify-center text-xs font-bold">
                {user?.name?.[0] || '?'}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Banner Slider */}
        <div className="relative mb-6 overflow-hidden rounded-xl">
          <div
            className={`bg-gradient-to-r ${banners[bannerIdx].gradient} p-6 rounded-xl min-h-[120px] flex flex-col justify-center transition-all duration-500`}
          >
            <h2 className="text-xl font-black text-white mb-1">{banners[bannerIdx].title}</h2>
            <p className="text-white/90 font-bold">{banners[bannerIdx].subtitle}</p>
            <p className="text-white/70 text-sm mt-1">{banners[bannerIdx].desc}</p>
          </div>
          {/* Dots */}
          <div className="flex gap-1.5 justify-center mt-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === bannerIdx ? 'bg-[#FF4500] w-6' : 'bg-gray-600 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        {user && (
          <div className="game-card p-4 mb-6 flex items-center justify-between">
            <div className="text-center">
              <p className="text-[#FFD700] font-bold text-lg">₹{user.wallet_balance || 0}</p>
              <p className="text-gray-500 text-xs">Wallet</p>
            </div>
            <div className="h-8 w-px bg-[#2a2a2a]" />
            <div className="text-center">
              <p className="text-[#FF4500] font-bold text-lg">{user.ff_uid ? '✅' : '❌'}</p>
              <p className="text-gray-500 text-xs">UID Bound</p>
            </div>
            <div className="h-8 w-px bg-[#2a2a2a]" />
            <Link href="/wallet">
              <button className="btn-primary text-xs py-2 px-3 rounded-lg">Add ₹</button>
            </Link>
          </div>
        )}

        {/* UID Bind Alert */}
        {user && !user.ff_uid && (
          <Link href="/bind-uid">
            <div className="bg-[#FF4500]/10 border border-[#FF4500] rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-[#FF4500] font-bold text-sm">⚠️ Bind Your Free Fire UID</p>
                <p className="text-gray-400 text-xs">Required to join matches</p>
              </div>
              <ChevronRight size={16} className="text-[#FF4500]" />
            </div>
          </Link>
        )}

        {/* Live Matches */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-white">
            🔥 LIVE MATCHES
          </h2>
          <Link href="/matches" className="text-[#FF4500] text-sm font-semibold">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎮</p>
            <p className="text-gray-400">No matches available right now</p>
            <p className="text-gray-600 text-sm mt-1">Check back soon!</p>
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
