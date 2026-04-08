'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getLeaderboard } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Trophy, Swords } from 'lucide-react';
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

const rankBadges = [
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: '1st' },
  { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: '2nd' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: '3rd' },
];

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

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="font-semibold text-gray-900 flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          Leaderboard
        </h1>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 px-4 pt-4 mb-4">
        {['daily', 'weekly', 'monthly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 px-6">
          <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No data for this period</p>
        </div>
      ) : (
        <div className="px-4">
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-6 pt-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-10 h-10 mb-1">
                  <Image src="/images/crown2-c8aced52.png" alt="2nd" fill className="object-contain" />
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 mb-2 border-2 border-gray-300">
                  {entries[1].ff_name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-gray-700 text-xs font-medium text-center line-clamp-1">{entries[1].ff_name || entries[1].name}</p>
                <p className="text-gray-500 text-xs">{formatCurrency(entries[1].total_earnings)}</p>
                <div className="relative w-8 h-8 mt-1">
                  <Image src="/images/place2-8189be28.png" alt="2nd place" fill className="object-contain" />
                </div>
                <div className="bg-gray-200 rounded-t-lg w-full mt-1 flex flex-col items-center justify-center h-14">
                  <span className="text-gray-600 text-xs font-bold">#2</span>
                </div>
              </div>
              {/* 1st Place */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-12 h-12 mb-1">
                  <Image src="/images/crown1-3912fd85.png" alt="1st" fill className="object-contain" />
                </div>
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-700 mb-2 border-2 border-amber-300">
                  {entries[0].ff_name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-gray-900 text-xs font-semibold text-center line-clamp-1">{entries[0].ff_name || entries[0].name}</p>
                <p className="text-amber-600 text-xs font-medium">{formatCurrency(entries[0].total_earnings)}</p>
                <div className="relative w-8 h-8 mt-1">
                  <Image src="/images/place1-fe39c3f3.png" alt="1st place" fill className="object-contain" />
                </div>
                <div className="bg-amber-100 border border-amber-200 rounded-t-lg w-full mt-1 flex flex-col items-center justify-center h-20">
                  <span className="text-amber-700 text-xs font-bold">#1</span>
                </div>
              </div>
              {/* 3rd Place */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-10 h-10 mb-1">
                  <Image src="/images/crown3-2ca02146.png" alt="3rd" fill className="object-contain" />
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-lg font-bold text-orange-700 mb-2 border-2 border-orange-200">
                  {entries[2].ff_name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-gray-700 text-xs font-medium text-center line-clamp-1">{entries[2].ff_name || entries[2].name}</p>
                <p className="text-gray-500 text-xs">{formatCurrency(entries[2].total_earnings)}</p>
                <div className="relative w-8 h-8 mt-1">
                  <Image src="/images/place3-d9b0be38.png" alt="3rd place" fill className="object-contain" />
                </div>
                <div className="bg-orange-100 rounded-t-lg w-full mt-1 flex flex-col items-center justify-center h-10">
                  <span className="text-orange-700 text-xs font-bold">#3</span>
                </div>
              </div>
            </div>
          )}

          {/* Rest of the leaderboard */}
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const badge = rankBadges[index];
              return (
                <div
                  key={entry.user_id}
                  className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
                >
                  <div className="w-8 text-center">
                    {index < 3 ? (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-semibold text-sm">{index + 1}</span>
                    )}
                  </div>

                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600 flex-shrink-0 relative overflow-hidden">
                    <Image
                      src="/images/avatar-default.svg"
                      alt="avatar"
                      fill
                      className="object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="relative z-10">{entry.ff_name?.[0]?.toUpperCase() || '?'}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium text-sm truncate">{entry.ff_name || entry.name}</p>
                    <p className="text-gray-400 text-xs">UID: {entry.ff_uid}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-emerald-600 font-semibold text-sm">{formatCurrency(entry.total_earnings)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Swords size={10} className="text-gray-400" />
                      <span className="text-gray-400 text-xs">{entry.total_kills} kills</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
