'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getResultDetails, uploadResult } from '@/lib/api';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

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
