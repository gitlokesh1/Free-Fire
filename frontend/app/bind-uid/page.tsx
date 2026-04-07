'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bindUID } from '@/lib/api';
import { setAuth, getUser } from '@/lib/utils';
import { Shield, AlertTriangle } from 'lucide-react';

export default function BindUIDPage() {
  const router = useRouter();
  const [ffUID, setFFUID] = useState('');
  const [ffName, setFFName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBind = async () => {
    setError('');
    if (!ffUID.trim()) {
      setError('Please enter your Free Fire UID');
      return;
    }
    if (!ffName.trim()) {
      setError('Please enter your in-game name');
      return;
    }

    setLoading(true);
    try {
      const res = await bindUID({ ff_uid: ffUID.trim(), ff_name: ffName.trim() });
      const user = getUser();
      if (user) {
        setAuth(localStorage.getItem('token') || '', res.data.user);
      }
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to bind UID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0A0A0A]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#FF4500]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-black text-white mb-1">
            Bind Free Fire Account
          </h1>
          <p className="text-gray-500 text-sm">Link your FF account to participate in matches</p>
        </div>

        {/* Warning Card */}
        <div className="bg-[#FF4500]/10 border border-[#FF4500]/50 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="text-[#FF4500] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#FF4500] font-bold text-sm mb-1">⚠️ Important Notice</p>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• You can only bind ONE Free Fire UID</li>
                <li>• This cannot be changed by yourself</li>
                <li>• All matches must be played with this UID</li>
                <li>• Screenshots must show this exact UID</li>
                <li>• Duplicate UIDs are not allowed</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm font-semibold mb-2 block">
              🆔 FREE FIRE UID
            </label>
            <input
              type="text"
              value={ffUID}
              onChange={(e) => setFFUID(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter your FF UID (numbers only)"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF4500] transition-colors"
            />
            <p className="text-gray-600 text-xs mt-1">
              Find your UID in Free Fire → Profile → tap on your avatar
            </p>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-semibold mb-2 block">
              🎮 IN-GAME NAME
            </label>
            <input
              type="text"
              value={ffName}
              onChange={(e) => setFFName(e.target.value)}
              placeholder="Your Free Fire name"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleBind}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield size={18} />
                BIND MY ACCOUNT 🔗
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">
            Already have UID bound?{' '}
            <a href="/" className="text-[#FF4500] hover:underline">
              Go Home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
