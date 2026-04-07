'use client';

import { useState, useEffect } from 'react';
import { getStatusBadgeClass, formatCurrency, formatDate } from '@/lib/utils';
import { Clock, Users, Swords } from 'lucide-react';
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
  participant_count?: number;
}

interface MatchCardProps {
  match: Match;
  participantCount?: number;
}

export default function MatchCard({ match, participantCount = 0 }: MatchCardProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(match.scheduled_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Starting Soon');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [match.scheduled_at]);

  const mapTypeIcons: Record<string, string> = {
    solo: '👤',
    duo: '👥',
    squad: '🎮',
    custom: '⚙️',
  };

  return (
    <Link href={`/match/${match.id}`}>
      <div className="game-card p-4 cursor-pointer hover:scale-[1.02] transition-transform">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{mapTypeIcons[match.type] || '🔥'}</span>
              <h3 className="font-bold text-white text-sm leading-tight">{match.title}</h3>
            </div>
            <p className="text-gray-500 text-xs">{match.map} • {match.type.toUpperCase()}</p>
          </div>
          <span className={getStatusBadgeClass(match.status)}>
            {match.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-[#0A0A0A] rounded-lg p-2 text-center">
            <p className="text-[#FF4500] font-bold text-sm">{formatCurrency(match.entry_fee)}</p>
            <p className="text-gray-500 text-xs">Entry</p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 text-center">
            <p className="text-[#FFD700] font-bold text-sm">{formatCurrency(match.per_kill_reward)}</p>
            <p className="text-gray-500 text-xs">Per Kill</p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 text-center">
            <p className="text-green-400 font-bold text-sm">{participantCount}/{match.max_players}</p>
            <p className="text-gray-500 text-xs">Players</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock size={12} />
            <span>{timeLeft || formatDate(match.scheduled_at)}</span>
          </div>
          <button className="btn-primary text-xs py-2 px-4 rounded-lg">
            JOIN NOW 🔥
          </button>
        </div>

        {/* Player fill bar */}
        <div className="mt-3">
          <div className="w-full bg-[#0A0A0A] rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-[#FF4500] to-[#FFD700] h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((participantCount / match.max_players) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
