'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { sendOTP, verifyOTP } from '@/lib/api';
import { setAuth } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/login_banner.34f15f30.png"
          alt="Login Background"
          fill
          className="object-cover opacity-20"
          priority
        />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 relative w-20 h-20">
            <Image
              src="/images/biglogo.png"
              alt="BattleZone Arena"
              fill
              className="object-contain"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">BattleZone Arena</h1>
          <p className="text-gray-500 text-sm mt-1">Free Fire Tournament Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {step === 'phone' ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Welcome back</h2>
                <p className="text-gray-500 text-sm">Enter your phone number to continue</p>
              </div>

              <div>
                <label className="text-gray-600 text-sm font-medium mb-2 block">Phone Number</label>
                <div className="flex gap-2">
                  <div className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 text-gray-600 text-sm flex items-center">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-sm font-medium mb-2 block">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value.toUpperCase())}
                  placeholder="Enter referral code"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setStep('phone')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm">Change Number</span>
              </button>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Verify OTP</h2>
                <p className="text-gray-500 text-sm mb-4">Sent to +91 {phone}</p>
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
                      className="w-11 h-12 bg-white border border-gray-300 rounded-lg text-center text-gray-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Verify & Login'
                )}
              </button>

              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-gray-400 text-sm">Resend in {timer}s</p>
                ) : (
                  <button
                    onClick={handleSendOTP}
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
