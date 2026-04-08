'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bindUID } from '@/lib/api';
import { setAuth, getUser } from '@/lib/utils';
import { Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Free Fire themed inline SVG illustration
function FFIllustration() {
  return (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[180px] mx-auto">
      <defs>
        <linearGradient id="ffGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4500"/>
          <stop offset="100%" stopColor="#FFD700"/>
        </linearGradient>
        <filter id="ffGlow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Background hex pattern */}
      <g opacity="0.1" stroke="#FF4500" strokeWidth="0.8" fill="none">
        <polygon points="100,5 115,13 115,29 100,37 85,29 85,13"/>
        <polygon points="130,20 145,28 145,44 130,52 115,44 115,28"/>
        <polygon points="70,20 85,28 85,44 70,52 55,44 55,28"/>
      </g>
      {/* Shield/badge central element */}
      <g transform="translate(70, 10)" filter="url(#ffGlow)">
        <path d="M30 3 L54 13 L54 35 Q54 55 30 65 Q6 55 6 35 L6 13 Z"
              fill="#141414" stroke="url(#ffGrad)" strokeWidth="2"/>
        {/* Shield inner design */}
        <path d="M30 10 L47 18 L47 34 Q47 50 30 58 Q13 50 13 34 L13 18 Z"
              fill="none" stroke="url(#ffGrad)" strokeWidth="0.8" opacity="0.5"/>
        {/* UID Text */}
        <text x="30" y="38" textAnchor="middle" fontFamily="Arial Black,sans-serif"
              fontWeight="900" fontSize="12" fill="url(#ffGrad)">UID</text>
        {/* Small dots */}
        <circle cx="30" cy="14" r="1.5" fill="#FFD700" opacity="0.8"/>
        <circle cx="47" cy="34" r="1" fill="#FF4500" opacity="0.6"/>
        <circle cx="13" cy="34" r="1" fill="#FF4500" opacity="0.6"/>
      </g>
      {/* Decorative lines */}
      <line x1="10" y1="80" x2="70" y2="80" stroke="#FF4500" strokeWidth="0.8" opacity="0.4"/>
      <line x1="130" y1="80" x2="190" y2="80" stroke="#FF4500" strokeWidth="0.8" opacity="0.4"/>
      <line x1="10" y1="85" x2="50" y2="85" stroke="#FFD700" strokeWidth="0.5" opacity="0.3"/>
      <line x1="150" y1="85" x2="190" y2="85" stroke="#FFD700" strokeWidth="0.5" opacity="0.3"/>
      {/* Crosshair on right */}
      <g transform="translate(155, 15)" stroke="#FF4500" strokeWidth="1.5" fill="none" opacity="0.7">
        <circle cx="15" cy="15" r="12"/>
        <circle cx="15" cy="15" r="4"/>
        <line x1="15" y1="0" x2="15" y2="6"/>
        <line x1="15" y1="24" x2="15" y2="30"/>
        <line x1="0" y1="15" x2="6" y2="15"/>
        <line x1="24" y1="15" x2="30" y2="15"/>
      </g>
      {/* Small gaming icons */}
      <text x="25" y="110" fontSize="10" fill="#FF4500" opacity="0.6" fontFamily="sans-serif">FREE FIRE</text>
      <line x1="25" y1="95" x2="175" y2="95" stroke="url(#ffGrad)" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  );
}

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
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-[#FFD700]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <FFIllustration />
          <h1 className="text-2xl font-black text-white mb-1 mt-2">
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
            <Link href="/" className="text-[#FF4500] hover:underline">
              Go Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
