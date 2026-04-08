'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getStatusBadgeClass, formatCurrency, formatDate } from '@/lib/utils';
import { Clock, MapPin, Users } from 'lucide-react';
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

  const fillPercent = Math.min((participantCount / match.max_players) * 100, 100);

  return (
    <Link href={`/match/${match.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
        {/* Card background image strip */}
        <div className="relative h-10 w-full">
          <Image
            src="/images/game-card-bg.webp"
            alt=""
            fill
            className="object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-indigo-600/70 flex items-center px-4 gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize bg-white/20 text-white`}>
              {match.type}
            </span>
            <span className={getStatusBadgeClass(match.status)}>
              {match.status.toUpperCase()}
            </span>
            <span className="ml-auto flex items-center gap-1 text-white/80 text-xs">
              <MapPin size={11} />
              {match.map}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">{match.title}</h3>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-indigo-600 font-bold text-sm">{formatCurrency(match.entry_fee)}</p>
              <p className="text-gray-400 text-xs">Entry</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-emerald-600 font-bold text-sm">{formatCurrency(match.per_kill_reward)}</p>
              <p className="text-gray-400 text-xs">Per Kill</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-gray-700 font-bold text-sm">{participantCount}/{match.max_players}</p>
              <p className="text-gray-400 text-xs">Players</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock size={11} />
              <span>{timeLeft || formatDate(match.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Users size={11} />
              <span>{Math.round(fillPercent)}% filled</span>
            </div>
          </div>

          {/* Player fill bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors">
            Join Match
          </button>
        </div>
      </div>
    </Link>
  );
}
