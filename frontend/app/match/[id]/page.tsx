'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMatch, joinMatch } from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { ArrowLeft, Users, MapPin, Clock, Swords, Lock, Eye } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

interface Match {
  id: number;
  title: string;
  type: string;
  entry_fee: number;
  per_kill_reward: number;
  max_players: number;
  map: string;
  status: string;
  room_id?: string;
  room_password?: string;
  scheduled_at: string;
  participants?: Participant[];
  creator_type: string;
}

interface Participant {
  user_id: number;
  name: string;
  ff_uid: string;
  ff_name: string;
  status: string;
}

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomPass, setRoomPass] = useState('');
  const [showRoom, setShowRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    try {
      const res = await getMatch(Number(id));
      setMatch(res.data.match);
      setJoined(res.data.joined);
      if (res.data.joined) {
        setRoomId(res.data.room_id || '');
        setRoomPass(res.data.room_password || '');
      }
      setParticipantCount(res.data.match?.participants?.length || 0);
    } catch {
      setError('Match not found');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setError('');
    setJoining(true);
    try {
      const res = await joinMatch(Number(id));
      setJoined(true);
      setRoomId(res.data.room_id || '');
      setRoomPass(res.data.room_password || '');
      setMatch(res.data.match);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to join match');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-10 h-10 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <p className="text-gray-400 text-lg">Match not found</p>
        <Link href="/" className="text-[#FF4500] mt-4">Go Home</Link>
      </div>
    );
  }

  const typeIcons: Record<string, string> = { solo: '👤', duo: '👥', squad: '🎮', custom: '⚙️' };

  return (
    <div className="min-h-screen pb-24 bg-[#0A0A0A]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h1 className="font-bold text-white">Match Details</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Match Header Card */}
        <div className="game-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{typeIcons[match.type] || '🔥'}</span>
                <div>
                  <h2 className="text-xl font-black text-white">{match.title}</h2>
                  <p className="text-gray-500 text-sm">{match.map} • {match.type.toUpperCase()}</p>
                </div>
              </div>
            </div>
            <span className={getStatusBadgeClass(match.status)}>{match.status.toUpperCase()}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
              <p className="text-[#FF4500] text-2xl font-black">{formatCurrency(match.entry_fee)}</p>
              <p className="text-gray-500 text-xs">Entry Fee</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
              <p className="text-[#FFD700] text-2xl font-black">{formatCurrency(match.per_kill_reward)}</p>
              <p className="text-gray-500 text-xs">Per Kill Reward</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
              <p className="text-green-400 text-2xl font-black">
                {participantCount}/{match.max_players}
              </p>
              <p className="text-gray-500 text-xs">Players</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
              <p className="text-blue-400 text-sm font-bold mt-1">
                {formatDate(match.scheduled_at)}
              </p>
              <p className="text-gray-500 text-xs">Scheduled</p>
            </div>
          </div>
        </div>

        {/* Room Credentials (after joining) */}
        {joined && (
          <div className="game-card p-4 border-[#FFD700]/50 border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#FFD700] font-bold">🔑 Room Credentials</h3>
              <button
                onClick={() => setShowRoom(!showRoom)}
                className="flex items-center gap-1 text-gray-400 text-sm"
              >
                <Eye size={14} />
                {showRoom ? 'Hide' : 'Show'}
              </button>
            </div>
            {showRoom ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg p-3">
                  <span className="text-gray-400 text-sm">Room ID</span>
                  <span className="text-white font-bold">{roomId || 'Not set yet'}</span>
                </div>
                <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg p-3">
                  <span className="text-gray-400 text-sm">Password</span>
                  <span className="text-white font-bold">{roomPass || 'Not set yet'}</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
                <Lock size={16} className="mx-auto text-gray-600 mb-1" />
                <p className="text-gray-600 text-sm">Tap Show to reveal</p>
              </div>
            )}
            <Link href={`/result/${id}`}>
              <button className="btn-secondary w-full mt-3 text-sm">
                📤 Upload Result Screenshot
              </button>
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Join Button */}
        {!joined && match.status !== 'completed' && match.status !== 'cancelled' && (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg animate-pulse-glow disabled:opacity-50"
          >
            {joining ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Swords size={20} />
                JOIN MATCH — {formatCurrency(match.entry_fee)}
              </>
            )}
          </button>
        )}

        {/* Participants */}
        <div className="game-card p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Users size={16} className="text-[#FF4500]" />
            Joined Players ({participantCount}/{match.max_players})
          </h3>
          {match.participants && match.participants.length > 0 ? (
            <div className="space-y-2">
              {match.participants.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between bg-[#0A0A0A] rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-[#FF4500] to-[#FFD700] rounded-full flex items-center justify-center text-xs font-bold">
                      {p.ff_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{p.ff_name || p.name}</p>
                      <p className="text-gray-500 text-xs">UID: {p.ff_uid}</p>
                    </div>
                  </div>
                  <span className="text-green-400 text-xs">✓ Ready</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm text-center py-4">No players joined yet</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
