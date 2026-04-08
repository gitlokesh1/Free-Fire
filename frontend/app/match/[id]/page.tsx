'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMatch, joinMatch } from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { ArrowLeft, Users, MapPin, Clock, Swords, Lock, Eye, EyeOff } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <p className="text-gray-500 text-lg">Match not found</p>
        <Link href="/" className="text-indigo-600 mt-4 font-medium">Go Home</Link>
      </div>
    );
  }

  const typeLabels: Record<string, string> = { solo: 'Solo', duo: 'Duo', squad: 'Squad', custom: 'Custom' };
  const typeColors: Record<string, string> = {
    solo: 'bg-indigo-50 text-indigo-600',
    duo: 'bg-blue-50 text-blue-600',
    squad: 'bg-purple-50 text-purple-600',
    custom: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="font-semibold text-gray-900">Match Details</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Match Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${typeColors[match.type] || 'bg-gray-100 text-gray-600'}`}>
                  {typeLabels[match.type] || match.type}
                </span>
                <span className={getStatusBadgeClass(match.status)}>{match.status.toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{match.title}</h2>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin size={13} />
                <span>{match.map}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-indigo-600 text-xl font-bold">{formatCurrency(match.entry_fee)}</p>
              <p className="text-gray-400 text-xs">Entry Fee</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-emerald-600 text-xl font-bold">{formatCurrency(match.per_kill_reward)}</p>
              <p className="text-gray-400 text-xs">Per Kill Reward</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-gray-700 text-xl font-bold">
                {participantCount}/{match.max_players}
              </p>
              <p className="text-gray-400 text-xs">Players</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 text-sm font-medium mt-1">
                <Clock size={13} />
                <span className="text-xs">{formatDate(match.scheduled_at)}</span>
              </div>
              <p className="text-gray-400 text-xs">Scheduled</p>
            </div>
          </div>
        </div>

        {/* Room Credentials (after joining) */}
        {joined && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                <Lock size={16} className="text-indigo-600" />
                Room Credentials
              </h3>
              <button
                onClick={() => setShowRoom(!showRoom)}
                className="flex items-center gap-1 text-indigo-600 text-sm font-medium"
              >
                {showRoom ? <EyeOff size={14} /> : <Eye size={14} />}
                {showRoom ? 'Hide' : 'Show'}
              </button>
            </div>
            {showRoom ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <span className="text-gray-500 text-sm">Room ID</span>
                  <span className="text-gray-900 font-semibold font-mono">{roomId || 'Not set yet'}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <span className="text-gray-500 text-sm">Password</span>
                  <span className="text-gray-900 font-semibold font-mono">{roomPass || 'Not set yet'}</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                <Lock size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-gray-400 text-sm">Tap Show to reveal</p>
              </div>
            )}
            <Link href={`/result/${id}`}>
              <button className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm transition-colors">
                Upload Result Screenshot
              </button>
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Join Button */}
        {!joined && match.status !== 'completed' && match.status !== 'cancelled' && (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl w-full flex items-center justify-center gap-2 text-base disabled:opacity-50 transition-colors"
          >
            {joining ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Swords size={20} />
                Join Match — {formatCurrency(match.entry_fee)}
              </>
            )}
          </button>
        )}

        {/* Participants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            Joined Players ({participantCount}/{match.max_players})
          </h3>
          {match.participants && match.participants.length > 0 ? (
            <div className="space-y-2">
              {match.participants.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600">
                      {p.ff_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{p.ff_name || p.name}</p>
                      <p className="text-gray-400 text-xs">UID: {p.ff_uid}</p>
                    </div>
                  </div>
                  <span className="text-emerald-600 text-xs font-medium">Ready</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No players joined yet</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
