'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendOTP, verifyOTP } from '@/lib/api';
import { setAuth } from '@/lib/utils';
import { ArrowLeft, Flame } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sessionId, setSessionId] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleSendOTP = async () => {
    setError('');
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await sendOTP(phone);
      setSessionId(res.data.session_id);
      setStep('otp');
      setTimer(30);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOTP({
        phone,
        otp: otpString,
        session_id: sessionId,
        referral_code: referral || undefined,
      });
      setAuth(res.data.token, res.data.user);

      if (!res.data.user.ff_uid) {
        router.push('/bind-uid');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FF4500]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FFD700]/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3 animate-float inline-block">🔥</div>
          <h1
            className="text-3xl font-black gradient-text"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            BATTLEZONE
          </h1>
          <p className="text-[#FFD700] font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            ARENA
          </p>
          <p className="text-gray-500 text-sm mt-1">Free Fire Tournament Platform</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm font-semibold mb-2 block">
                📱 PHONE NUMBER
              </label>
              <div className="flex gap-2">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-3 text-gray-400 text-sm flex items-center">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF4500] transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm font-semibold mb-2 block">
                🎁 REFERRAL CODE (Optional)
              </label>
              <input
                type="text"
                value={referral}
                onChange={(e) => setReferral(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Flame size={18} />
                  SEND OTP
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setStep('phone')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Change Number</span>
            </button>

            <div>
              <label className="text-gray-400 text-sm font-semibold mb-1 block">
                ENTER OTP
              </label>
              <p className="text-gray-600 text-xs mb-4">
                Sent to +91 {phone}
              </p>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="w-11 h-12 bg-[#141414] border border-[#2a2a2a] rounded-lg text-center text-white font-bold text-lg focus:outline-none focus:border-[#FF4500] transition-colors"
                    maxLength={1}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '✅ VERIFY & LOGIN'
              )}
            </button>

            <div className="text-center">
              {timer > 0 ? (
                <p className="text-gray-500 text-sm">Resend in {timer}s</p>
              ) : (
                <button
                  onClick={handleSendOTP}
                  className="text-[#FF4500] text-sm font-semibold hover:text-[#FF6500] transition-colors"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
