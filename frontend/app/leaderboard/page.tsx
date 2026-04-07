'use client';

import { useState, useEffect } from 'react';
import { getLeaderboard } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Trophy, Swords, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface LeaderboardEntry {
  user_id: number;
  name: string;
  ff_uid: string;
  ff_name: string;
  total_kills: number;
  total_earnings: number;
  total_matches: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await getLeaderboard(period);
      setEntries(res.data.leaderboard || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen pb-20 bg-[#0A0A0A]">
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h1 className="font-bold text-white flex items-center gap-2">
          <Trophy size={18} className="text-[#FFD700]" />
          Leaderboard
        </h1>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 px-4 pt-4 mb-4">
        {['daily', 'weekly', 'monthly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
              period === p
                ? 'bg-[#FF4500] text-white'
                : 'bg-[#141414] border border-[#2a2a2a] text-gray-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 px-6">
          <Trophy size={48} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-400">No data for this period</p>
        </div>
      ) : (
        <div className="px-4">
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-6 pt-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-xl font-black text-white mb-2">
                  {entries[1].ff_name?.[0] || '?'}
                </div>
                <p className="text-white text-xs font-bold text-center line-clamp-1">{entries[1].ff_name || entries[1].name}</p>
                <p className="text-[#FFD700] text-xs">{formatCurrency(entries[1].total_earnings)}</p>
                <div className="bg-gradient-to-t from-gray-500 to-gray-700 rounded-t-lg w-full mt-2 flex items-center justify-center h-16">
                  <span className="text-2xl">🥈</span>
                </div>
              </div>
              {/* 1st Place */}
              <div className="flex flex-col items-center flex-1">
                <Star size={16} className="text-[#FFD700] mb-1 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF8C00] flex items-center justify-center text-2xl font-black text-white mb-2 glow-gold">
                  {entries[0].ff_name?.[0] || '?'}
                </div>
                <p className="text-white text-xs font-bold text-center line-clamp-1">{entries[0].ff_name || entries[0].name}</p>
                <p className="text-[#FFD700] text-xs font-bold">{formatCurrency(entries[0].total_earnings)}</p>
                <div className="bg-gradient-to-t from-[#FFD700] to-[#FF8C00] rounded-t-lg w-full mt-2 flex items-center justify-center h-24">
                  <span className="text-3xl">🥇</span>
                </div>
              </div>
              {/* 3rd Place */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xl font-black text-white mb-2">
                  {entries[2].ff_name?.[0] || '?'}
                </div>
                <p className="text-white text-xs font-bold text-center line-clamp-1">{entries[2].ff_name || entries[2].name}</p>
                <p className="text-[#FFD700] text-xs">{formatCurrency(entries[2].total_earnings)}</p>
                <div className="bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-lg w-full mt-2 flex items-center justify-center h-12">
                  <span className="text-2xl">🥉</span>
                </div>
              </div>
            </div>
          )}

          {/* Rest of the leaderboard */}
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`game-card p-3 flex items-center gap-3 ${
                  index < 3 ? 'border-opacity-50' : ''
                }`}
                style={{ borderColor: index < 3 ? medalColors[index] : undefined }}
              >
                <div className="w-8 text-center">
                  {index < 3 ? (
                    <span className="text-xl">{medalEmojis[index]}</span>
                  ) : (
                    <span className="text-gray-500 font-bold">{index + 1}</span>
                  )}
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FFD700] flex items-center justify-center font-bold text-white flex-shrink-0">
                  {entry.ff_name?.[0] || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{entry.ff_name || entry.name}</p>
                  <p className="text-gray-500 text-xs">UID: {entry.ff_uid}</p>
                </div>

                <div className="text-right">
                  <p className="text-[#FFD700] font-bold text-sm">{formatCurrency(entry.total_earnings)}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Swords size={10} className="text-gray-500" />
                    <span className="text-gray-500 text-xs">{entry.total_kills} kills</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
