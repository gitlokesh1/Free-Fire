'use client';

import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/api';
import { clearAuth, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { LogOut, ChevronRight, Trophy, Swords, Wallet, Users, HelpCircle, Shield } from 'lucide-react';

interface ProfileData {
  user: {
    id: number;
    phone: string;
    name: string;
    ff_uid: string;
    ff_name: string;
    wallet_balance: number;
    referral_code: string;
    is_admin: boolean;
  };
  match_count: number;
  win_count: number;
  total_earnings: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const menuItems = [
    { icon: Swords, label: 'My Matches', href: '/matches', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Wallet, label: 'Wallet', href: '/wallet', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Users, label: 'Referral Program', href: '/referral', color: 'text-purple-600', bg: 'bg-purple-50' },
    ...(profile.user.is_admin ? [{ icon: Shield, label: 'Admin Panel', href: '/admin', color: 'text-red-600', bg: 'bg-red-50' }] : []),
    { icon: HelpCircle, label: 'Support', href: '#', color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="min-h-screen pb-20 bg-gray-50 relative">
      {/* Background image */}
      <div className="absolute top-0 left-0 right-0 h-48 z-0">
        <Image
          src="/images/myProfilebg.298e3612.png"
          alt="Profile Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50" />
      </div>

      <div className="px-4 pt-6 pb-4 relative z-10">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 flex-shrink-0 border-2 border-indigo-200 overflow-hidden relative">
              <Image
                src="/images/avatar.svg"
                alt="Avatar"
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <span className="relative z-10">
                {(profile.user.ff_name || profile.user.name || '?')[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.user.ff_name || 'Set FF Name'}
              </h2>
              {profile.user.name && (
                <p className="text-gray-500 text-sm">{profile.user.name}</p>
              )}
              <p className="text-gray-400 text-xs">{profile.user.phone}</p>
              {/* VIP Level Badge */}
              <div className="mt-1 relative w-10 h-10">
                <Image
                  src="/images/king (1).png"
                  alt="VIP Level"
                  fill
                  className="object-contain"
                />
              </div>
              {profile.user.is_admin && (
                <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* UID Info */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
            {profile.user.ff_uid ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Free Fire UID</p>
                  <p className="text-gray-900 font-semibold font-mono">{profile.user.ff_uid}</p>
                </div>
                <span className="text-emerald-600 text-sm font-medium">Linked</span>
              </div>
            ) : (
              <Link href="/bind-uid" className="flex items-center justify-between">
                <p className="text-amber-600 text-sm font-medium">Bind Your FF UID</p>
                <ChevronRight size={16} className="text-amber-500" />
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-indigo-600 font-bold text-xl">{profile.match_count}</p>
              <p className="text-gray-400 text-xs">Matches</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-amber-600 font-bold text-xl">{profile.win_count}</p>
              <p className="text-gray-400 text-xs">Wins</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-emerald-600 font-bold text-lg">{formatCurrency(profile.total_earnings)}</p>
              <p className="text-gray-400 text-xs">Earned</p>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Wallet Balance</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(profile.user.wallet_balance)}</p>
          </div>
          <Link href="/wallet">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4 rounded-lg font-medium transition-colors">
              Manage
            </button>
          </Link>
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your Referral Code</p>
              <p className="text-indigo-600 font-bold text-xl tracking-wider font-mono">
                {profile.user.referral_code}
              </p>
            </div>
            <Link href="/referral">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-lg font-medium transition-colors">
                Share
              </button>
            </Link>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.bg}`}>
                    <Icon size={18} className={item.color} />
                  </div>
                  <span className="text-gray-900 font-medium flex-1">{item.label}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3 mt-2 hover:bg-red-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <LogOut size={18} className="text-red-500" />
          </div>
          <span className="text-red-500 font-medium">Logout</span>
        </button>

        <p className="text-gray-400 text-xs text-center mt-6">
          BattleZone Arena v1.0
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
