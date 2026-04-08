'use client';

import { useState, useEffect } from 'react';
import { getStatusBadgeClass, formatCurrency, formatDate } from '@/lib/utils';
import { Clock } from 'lucide-react';
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

// Map-specific color themes and terrain icons
const mapThemes: Record<string, { bg: string; accent: string; iconPath: string; label: string }> = {
  bermuda: { bg: 'from-green-900/80 to-emerald-950', accent: '#22C55E', iconPath: 'M8 14 Q12 6 16 14 Q20 6 24 14 L24 18 L8 18Z M16 4 L18 10 L16 14 L14 10Z', label: 'BERMUDA' },
  kalahari: { bg: 'from-orange-900/80 to-amber-950', accent: '#F97316', iconPath: 'M4 18 L10 8 L16 14 L20 6 L28 18Z', label: 'KALAHARI' },
  purgatory: { bg: 'from-blue-900/80 to-indigo-950', accent: '#6366F1', iconPath: 'M4 18 L10 4 L16 18Z M16 18 L22 4 L28 18Z', label: 'PURGATORY' },
  alpine: { bg: 'from-slate-700/80 to-slate-950', accent: '#94A3B8', iconPath: 'M16 3 L26 18 L6 18Z M4 18 Q16 12 28 18', label: 'ALPINE' },
};

function getMapTheme(map: string) {
  const key = map.toLowerCase().trim();
  return mapThemes[key] || { bg: 'from-gray-800/80 to-gray-950', accent: '#FF4500', iconPath: 'M16 4 L26 18 L6 18Z', label: map.toUpperCase() };
}

// SVG map thumbnail component
function MapThumbnail({ map }: { map: string }) {
  const theme = getMapTheme(map);
  const key = map.toLowerCase().trim();

  return (
    <div className={`relative w-20 h-16 rounded-lg overflow-hidden bg-gradient-to-br ${theme.bg} flex-shrink-0 border border-white/10`}>
      {/* Terrain SVG pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg">
        {key === 'bermuda' && (
          <>
            <ellipse cx="40" cy="40" rx="28" ry="18" fill="#166534" opacity="0.8"/>
            <ellipse cx="28" cy="36" rx="12" ry="8" fill="#15803D" opacity="0.7"/>
            <ellipse cx="55" cy="38" rx="10" ry="6" fill="#166534" opacity="0.6"/>
            <path d="M15 55 Q40 42 65 55" fill="#1E40AF" opacity="0.5"/>
          </>
        )}
        {key === 'kalahari' && (
          <>
            <path d="M0 45 Q20 30 40 35 Q60 40 80 28 L80 64 L0 64Z" fill="#92400E" opacity="0.7"/>
            <path d="M10 35 L18 20 L26 35Z" fill="#A16207" opacity="0.8"/>
            <path d="M50 40 L60 22 L70 40Z" fill="#92400E" opacity="0.8"/>
            <path d="M30 42 L38 28 L46 42Z" fill="#78350F" opacity="0.6"/>
          </>
        )}
        {key === 'purgatory' && (
          <>
            <path d="M0 60 Q20 30 40 45 Q60 55 80 25 L80 64 L0 64Z" fill="#1E3A5F" opacity="0.7"/>
            <path d="M5 40 L20 10 L35 40Z" fill="#1D4ED8" opacity="0.6"/>
            <path d="M45 45 L60 12 L75 45Z" fill="#1E40AF" opacity="0.6"/>
            <rect x="0" y="0" width="80" height="15" fill="#93C5FD" opacity="0.15"/>
          </>
        )}
        {(key === 'alpine' || (!mapThemes[key])) && (
          <>
            <path d="M0 64 Q20 35 40 50 Q60 60 80 30 L80 64Z" fill="#374151" opacity="0.7"/>
            <path d="M10 45 L25 10 L40 45Z" fill="#6B7280" opacity="0.7"/>
            <path d="M42 50 L58 15 L74 50Z" fill="#4B5563" opacity="0.6"/>
            <rect x="0" y="0" width="80" height="20" fill="white" opacity="0.1"/>
          </>
        )}
      </svg>
      {/* Map SVG icon overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <svg width="20" height="16" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
          <path d={theme.iconPath} fill={theme.accent} opacity="0.9"/>
        </svg>
        <span className="text-[8px] font-black tracking-wider text-white/90 drop-shadow">{theme.label}</span>
      </div>
      {/* Glow border */}
      <div className="absolute inset-0 rounded-lg" style={{ boxShadow: `inset 0 0 8px ${theme.accent}30` }}/>
    </div>
  );
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

  // Match type SVG icons
  const matchTypeColors: Record<string, string> = {
    solo: '#FF4500',
    duo: '#FFD700',
    squad: '#9B59B6',
    custom: '#22C55E',
  };
  const typeColor = matchTypeColors[match.type] || '#FF4500';

  return (
    <Link href={`/match/${match.id}`}>
      <div className="game-card p-4 cursor-pointer hover:scale-[1.02] transition-transform">
        <div className="flex items-start gap-3 mb-3">
          {/* Map Thumbnail */}
          <MapThumbnail map={match.map} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {/* Type indicator dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: typeColor, boxShadow: `0 0 4px ${typeColor}` }}
                />
                <h3 className="font-bold text-white text-sm leading-tight truncate">{match.title}</h3>
              </div>
              <span className={`${getStatusBadgeClass(match.status)} flex-shrink-0`}>
                {match.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">{match.map} • {match.type.toUpperCase()}</p>
          </div>
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
