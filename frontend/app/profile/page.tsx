'use client';

import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/api';
import { clearAuth, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-10 h-10 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const menuItems = [
    { icon: Swords, label: 'My Matches', href: '/matches', color: '#FF4500' },
    { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', color: '#FFD700' },
    { icon: Wallet, label: 'Wallet', href: '/wallet', color: '#64C864' },
    { icon: Users, label: 'Referral Program', href: '/referral', color: '#9B59B6' },
    ...(profile.user.is_admin ? [{ icon: Shield, label: 'Admin Panel', href: '/admin', color: '#FF4500' }] : []),
    { icon: HelpCircle, label: 'Support', href: '#', color: '#5B9BD5' },
  ];

  return (
    <div className="min-h-screen pb-20 bg-[#0A0A0A]">
      <div className="px-4 pt-8 pb-4">
        {/* Profile Header */}
        <div className="game-card p-5 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FFD700] flex items-center justify-center text-2xl font-black text-white">
              {profile.user.ff_name?.[0] || profile.user.phone.slice(-2)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-white">
                {profile.user.ff_name || 'Set FF Name'}
              </h2>
              {profile.user.name && (
                <p className="text-gray-400 text-sm">{profile.user.name}</p>
              )}
              <p className="text-gray-600 text-xs">📱 {profile.user.phone}</p>
              {profile.user.is_admin && (
                <span className="text-xs bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          {/* UID Info */}
          <div className="bg-[#0A0A0A] rounded-lg p-3 mb-4">
            {profile.user.ff_uid ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Free Fire UID</p>
                  <p className="text-white font-bold font-mono">{profile.user.ff_uid}</p>
                </div>
                <span className="text-green-400 text-sm">✅ Bound</span>
              </div>
            ) : (
              <Link href="/bind-uid" className="flex items-center justify-between">
                <p className="text-[#FF4500] text-sm font-bold">⚠️ Bind Your FF UID</p>
                <ChevronRight size={16} className="text-[#FF4500]" />
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
              <p className="text-[#FF4500] font-black text-xl">{profile.match_count}</p>
              <p className="text-gray-500 text-xs">Matches</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
              <p className="text-[#FFD700] font-black text-xl">{profile.win_count}</p>
              <p className="text-gray-500 text-xs">Wins</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
              <p className="text-green-400 font-black text-lg">{formatCurrency(profile.total_earnings)}</p>
              <p className="text-gray-500 text-xs">Earned</p>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-gradient-to-r from-[#FF4500]/20 to-[#FFD700]/10 border border-[#FF4500]/30 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Wallet Balance</p>
            <p className="text-2xl font-black text-white">{formatCurrency(profile.user.wallet_balance)}</p>
          </div>
          <Link href="/wallet">
            <button className="btn-primary text-sm py-2 px-4">Manage</button>
          </Link>
        </div>

        {/* Referral Code */}
        <div className="game-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your Referral Code</p>
              <p className="text-[#FFD700] font-black text-xl tracking-wider font-mono">
                {profile.user.referral_code}
              </p>
            </div>
            <Link href="/referral">
              <button className="btn-secondary text-sm py-2 px-3">Share</button>
            </Link>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="game-card p-4 flex items-center gap-3 cursor-pointer">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon size={18} style={{ color: item.color }} />
                  </div>
                  <span className="text-white font-semibold flex-1">{item.label}</span>
                  <ChevronRight size={16} className="text-gray-600" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full game-card p-4 flex items-center gap-3 mt-2 hover:border-red-500/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
            <LogOut size={18} className="text-red-400" />
          </div>
          <span className="text-red-400 font-semibold">Logout</span>
        </button>

        <p className="text-gray-700 text-xs text-center mt-6">
          BattleZone Arena v1.0 • Free Fire Tournaments
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
