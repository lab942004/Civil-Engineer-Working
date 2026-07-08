import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();

  const emailFromState = (location.state as { email?: string } | null)?.email;
  const [email] = useState(emailFromState || '');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!emailFromState) {
      // Someone landed here directly without going through registration/login.
      toast.error('Please register or log in first.');
      navigate('/register', { replace: true });
    }
  }, [emailFromState, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }
    const next = [...digits];
    next[index] = clean[clean.length - 1];
    setDigits(next);
    if (index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const code = digits.join('');

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setIsVerifying(true);
    try {
      const response = await api.post<{ user: any; accessToken: string; refreshToken: string }>(
        '/auth/verify-otp',
        { email, code }
      );
      if (response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        setUser(response.data.user);
        toast.success('Email verified! Welcome aboard.');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new code has been sent to your email');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[hsl(221.2,83.2%,53.3%)] flex items-center justify-center mx-auto">
              <MailCheck className="text-white" size={22} />
            </div>
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-[hsl(var(--foreground))]">{email}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-[hsl(var(--input))] bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            ))}
          </div>

          <Button type="button" className="w-full" disabled={isVerifying} onClick={handleVerify}>
            {isVerifying ? <Loader2 className="animate-spin" /> : 'Verify Email'}
          </Button>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            Didn't get the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="text-[hsl(221.2,83.2%,53.3%)] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : isResending ? 'Sending...' : 'Resend code'}
            </button>
          </p>

          <p className="text-center text-sm">
            <Link to="/login" className="text-[hsl(var(--muted-foreground))] hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
