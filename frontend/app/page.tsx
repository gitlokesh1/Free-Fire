'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

const bannerImages = [
  { src: '/images/b1.jpg', alt: 'Tournament Banner 1' },
  { src: '/images/b2.jpg', alt: 'Tournament Banner 2' },
  { src: '/images/b3.jpg', alt: 'Tournament Banner 3' },
  { src: '/images/b4.jpg', alt: 'Tournament Banner 4' },
  { src: '/images/b5.jpg', alt: 'Tournament Banner 5' },
];

const gameCategories = [
  { src: '/images/gamecategory_20231215033528g3gt.png', label: 'Lottery' },
  { src: '/images/gamecategory_2023121503353389nc.png', label: 'Casino' },
  { src: '/images/gamecategory_20231215033554mpgb.png', label: 'Slots' },
  { src: '/images/gamecategory_20231215033600k8os.png', label: 'Sports' },
  { src: '/images/gamecategory_20231215033607yi17.png', label: 'Chess' },
  { src: '/images/gamecategory_20231215033613klhe.png', label: 'Fishing' },
  { src: '/images/gamecategory_202312150336204mtb.png', label: 'Arcade' },
  { src: '/images/gamecategory_202312150336366phx.png', label: 'More' },
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
      setBannerIdx((i) => (i + 1) % bannerImages.length);
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
          <div className="mx-auto mb-4 w-20 h-20 relative">
            <Image
              src="/images/biglogo.png"
              alt="BattleZone Arena"
              fill
              className="object-contain"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.className = 'w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4';
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
                }
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BattleZone Arena</h1>
          <p className="text-gray-500 mt-2 text-sm">Free Fire Tournament Platform</p>
        </div>

        {/* Hero Banner */}
        <div className="w-full max-w-sm mb-6 rounded-xl overflow-hidden relative h-36">
          <Image
            src="/images/b1.jpg"
            alt="Tournament Banner"
            fill
            className="object-cover"
          />
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
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/images/headlogo.png"
                alt="BattleZone"
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
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
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600 overflow-hidden relative">
                <Image
                  src="/images/avatar-default.svg"
                  alt="Profile"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span className="relative z-10">{user?.name?.[0]?.toUpperCase() || '?'}</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Banner Slider */}
        <div className="relative mb-4 overflow-hidden rounded-xl">
          <div className="relative h-36 w-full rounded-xl overflow-hidden">
            <Image
              src={bannerImages[bannerIdx].src}
              alt={bannerImages[bannerIdx].alt}
              fill
              className="object-cover transition-opacity duration-500"
              priority={bannerIdx === 0}
            />
          </div>
          {/* Dots */}
          <div className="flex gap-1.5 justify-center mt-2">
            {bannerImages.map((_, i) => (
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
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center justify-between shadow-sm">
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

        {/* Game Categories */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Game Categories</h2>
          <div className="grid grid-cols-4 gap-2">
            {gameCategories.map((cat) => (
              <div key={cat.label} className="flex flex-col items-center gap-1 cursor-pointer">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={cat.src}
                    alt={cat.label}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-gray-600 font-medium text-center">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity / Promo Banners */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="relative h-20 rounded-xl overflow-hidden">
            <Image src="/images/banner-daily.svg" alt="Daily Bonus" fill className="object-cover" />
          </div>
          <div className="relative h-20 rounded-xl overflow-hidden">
            <Image src="/images/banner-tournament.svg" alt="Tournament" fill className="object-cover" />
          </div>
        </div>

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

      {/* Floating Customer Service Button */}
      <button
        className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full shadow-lg overflow-hidden"
        aria-label="Customer Service"
      >
        <Image
          src="/images/icon_sevice-9f0c8455.png"
          alt="Customer Service"
          fill
          className="object-cover"
        />
      </button>

      <BottomNav />
    </div>
  );
}
