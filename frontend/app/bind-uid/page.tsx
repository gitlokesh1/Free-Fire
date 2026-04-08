'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bindUID } from '@/lib/api';
import { setAuth, getUser } from '@/lib/utils';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Link Free Fire Account
          </h1>
          <p className="text-gray-500 text-sm">Connect your FF account to join matches</p>
        </div>

        {/* Info Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-700 font-semibold text-sm mb-1">Important Notice</p>
              <ul className="text-amber-600 text-xs space-y-1">
                <li>• You can only bind ONE Free Fire UID</li>
                <li>• This cannot be changed by yourself</li>
                <li>• All matches must be played with this UID</li>
                <li>• Screenshots must show this exact UID</li>
                <li>• Duplicate UIDs are not allowed</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium mb-2 block">
              Free Fire UID
            </label>
            <input
              type="text"
              value={ffUID}
              onChange={(e) => setFFUID(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter your FF UID (numbers only)"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <div className="flex items-start gap-1.5 mt-1.5">
              <Info size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-400 text-xs">
                Find your UID in Free Fire — Profile — tap on your avatar
              </p>
            </div>
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium mb-2 block">
              In-Game Name
            </label>
            <input
              type="text"
              value={ffName}
              onChange={(e) => setFFName(e.target.value)}
              placeholder="Your Free Fire name"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleBind}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield size={18} />
                Link My Account
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Already have UID bound?{' '}
            <Link href="/" className="text-indigo-600 hover:underline font-medium">
              Go Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
