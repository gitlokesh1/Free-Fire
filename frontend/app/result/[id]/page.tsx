'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getResultDetails, uploadResult } from '@/lib/api';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

// Screenshot guide illustration
function ScreenshotGuide() {
  return (
    <svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[220px] mx-auto">
      <defs>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4500" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.05"/>
        </linearGradient>
        <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF4500"/>
          <stop offset="100%" stopColor="#FFD700"/>
        </linearGradient>
      </defs>
      {/* Phone frame */}
      <rect x="75" y="5" width="90" height="130" rx="10" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="2"/>
      <rect x="80" y="15" width="80" height="110" rx="4" fill="url(#screenGrad)" stroke="#2a2a2a" strokeWidth="1"/>
      {/* Screen content - result screen mockup */}
      <rect x="82" y="17" width="76" height="106" rx="3" fill="#141414"/>
      {/* Result screen header */}
      <rect x="82" y="17" width="76" height="18" rx="3" fill="#1e1e1e"/>
      <text x="120" y="29" textAnchor="middle" fontSize="5" fill="#FF4500" fontFamily="sans-serif" fontWeight="bold">MATCH RESULT</text>
      {/* Kill count highlight */}
      <rect x="88" y="42" width="64" height="20" rx="3" fill="#FF4500" opacity="0.15" stroke="#FF4500" strokeWidth="0.8"/>
      <text x="120" y="50" textAnchor="middle" fontSize="4.5" fill="#aaa" fontFamily="sans-serif">KILLS</text>
      <text x="120" y="59" textAnchor="middle" fontSize="10" fill="#FF4500" fontFamily="sans-serif" fontWeight="bold">5</text>
      {/* Rank */}
      <rect x="88" y="67" width="64" height="16" rx="3" fill="#FFD700" opacity="0.1" stroke="#FFD700" strokeWidth="0.8"/>
      <text x="120" y="75" textAnchor="middle" fontSize="4.5" fill="#aaa" fontFamily="sans-serif">RANK</text>
      <text x="120" y="81" textAnchor="middle" fontSize="7" fill="#FFD700" fontFamily="sans-serif" fontWeight="bold">#3</text>
      {/* UID section with orange indicator */}
      <rect x="88" y="88" width="64" height="14" rx="2" fill="#0a0a0a" stroke="#FF4500" strokeWidth="1"/>
      <text x="92" y="93" fontSize="3.5" fill="#666" fontFamily="sans-serif">UID:</text>
      <text x="92" y="100" fontSize="3.5" fill="#FF4500" fontFamily="sans-serif" fontWeight="bold">123456789</text>
      {/* Arrow pointing to UID with label */}
      <line x1="60" y1="95" x2="85" y2="95" stroke="#FF4500" strokeWidth="1.5" strokeDasharray="2,1"/>
      <polygon points="83,93 87,95 83,97" fill="#FF4500"/>
      <text x="10" y="90" fontSize="4" fill="#FF4500" fontFamily="sans-serif" fontWeight="bold">UID must</text>
      <text x="10" y="96" fontSize="4" fill="#FF4500" fontFamily="sans-serif" fontWeight="bold">be visible</text>
      {/* Arrow pointing to kills with label */}
      <line x1="60" y1="52" x2="85" y2="52" stroke="#FF8C00" strokeWidth="1.5" strokeDasharray="2,1"/>
      <polygon points="83,50 87,52 83,54" fill="#FF8C00"/>
      <text x="10" y="47" fontSize="4" fill="#FF8C00" fontFamily="sans-serif" fontWeight="bold">Kill count</text>
      <text x="10" y="53" fontSize="4" fill="#FF8C00" fontFamily="sans-serif" fontWeight="bold">required</text>
      {/* Bottom guide bar -->*/}
      <rect x="0" y="130" width="240" height="10" fill="none"/>
      <line x1="10" y1="138" x2="230" y2="138" stroke="url(#highlightGrad)" strokeWidth="0.8" opacity="0.5"/>
    </svg>
  );
}

interface ResultDetails {
  participant: {
    status: string;
    screenshot_url: string;
    kills: number;
    rank: number;
    reward_amount: number;
    verified_by_admin: boolean;
  };
  match: {
    title: string;
    type: string;
  };
}

export default function ResultUploadPage() {
  const { id } = useParams();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ResultDetails | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const res = await getResultDetails(Number(id));
      setResult(res.data);
    } catch {
      // New submission
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a screenshot');
      return;
    }
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('screenshot', file);
    try {
      await uploadResult(Number(id), formData);
      setSuccess('Screenshot uploaded! Admin will verify within 30 minutes.');
      setFile(null);
      setPreview('');
      fetchResult();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const statusDisplay = () => {
    if (!result) return null;
    const s = result.participant.status;
    if (s === 'verified') {
      return (
        <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-400" />
            <p className="text-green-400 font-bold">Result Verified ✅</p>
          </div>
          <p className="text-gray-400 text-sm">Kills: {result.participant.kills}</p>
          <p className="text-gray-400 text-sm">Rank: #{result.participant.rank}</p>
          <p className="text-[#FFD700] font-bold">
            Reward: ₹{result.participant.reward_amount}
          </p>
        </div>
      );
    }
    if (s === 'submitted') {
      return (
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/50 rounded-xl p-4 mb-4">
          <p className="text-[#FFD700] font-bold">⏳ Result Submitted</p>
          <p className="text-gray-400 text-sm mt-1">Waiting for admin verification...</p>
        </div>
      );
    }
    if (s === 'rejected') {
      return (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-4">
          <p className="text-red-400 font-bold">❌ Result Rejected</p>
          <p className="text-gray-400 text-sm mt-1">Contact support for help</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-10">
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h1 className="font-bold text-white">Upload Result</h1>
      </div>

      <div className="px-4 pt-4 max-w-sm mx-auto space-y-4">
        {result && (
          <div className="game-card p-3">
            <p className="text-gray-400 text-sm">
              {result.match.title} • {result.match.type.toUpperCase()}
            </p>
          </div>
        )}

        {statusDisplay()}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Warning */}
        <div className="bg-[#FF4500]/10 border border-[#FF4500]/50 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="text-[#FF4500] flex-shrink-0" />
            <div>
              <p className="text-[#FF4500] font-bold text-sm mb-1">⚠️ Screenshot Requirements</p>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• Your Free Fire UID must be clearly visible</li>
                <li>• Kill count must be visible in screenshot</li>
                <li>• Final result screen required (not in-game)</li>
                <li>• Use the same account as your bound UID</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        {(!result || result.participant.status === 'joined') && (
          <div>
            {/* Screenshot guide illustration */}
            <div className="game-card p-4 mb-4 text-center">
              <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">Screenshot Guide</p>
              <ScreenshotGuide />
              <p className="text-gray-600 text-xs mt-2">Your screenshot should look similar to this</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#2a2a2a] hover:border-[#FF4500] rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              {preview ? (
                <div className="relative">
                  <Image
                    src={preview}
                    alt="Screenshot preview"
                    width={400}
                    height={300}
                    className="rounded-lg mx-auto max-h-48 object-contain"
                  />
                  <p className="text-gray-400 text-sm mt-2">Tap to change</p>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 font-semibold">Upload Screenshot</p>
                  <p className="text-gray-600 text-sm mt-1">JPG, PNG up to 5MB</p>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mt-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={18} />
                  SUBMIT RESULT 📤
                </>
              )}
            </button>
            <p className="text-gray-600 text-xs text-center mt-2">
              Admin will verify within 30 minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
