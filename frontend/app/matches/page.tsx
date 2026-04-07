'use client';

import { useState, useEffect } from 'react';
import { getMatches } from '@/lib/api';
import MatchCard from '@/components/MatchCard';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMatches();
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

  const filtered = filter === 'all'
    ? matches
    : matches.filter((m) => m.type === filter);

  return (
    <div className="min-h-screen pb-20 bg-[#0A0A0A]">
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="font-bold text-white">🎮 Matches</h1>
        </div>
        <Link href="/matches/create">
          <button className="flex items-center gap-1 text-[#FF4500] text-sm font-semibold">
            <Plus size={16} /> Create
          </button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto">
        {['all', 'solo', 'duo', 'squad', 'custom'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
              filter === t
                ? 'bg-[#FF4500] text-white'
                : 'bg-[#141414] border border-[#2a2a2a] text-gray-400'
            }`}
          >
            {t === 'all' ? '🔥 All' : t}
          </button>
        ))}
      </div>

      <div className="px-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎮</p>
            <p className="text-gray-400">No matches found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                participantCount={match.participant_count}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
