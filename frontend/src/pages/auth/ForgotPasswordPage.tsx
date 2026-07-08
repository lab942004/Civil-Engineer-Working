import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';

const schema = z.object({ email: z.string().email('Please enter a valid email') });

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Enter your email to receive a reset link</p>
          </div>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-green-600 dark:text-green-400">Reset link sent! Check your email.</p>
              <Link to="/login"><Button variant="outline">Back to Login</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
              </Button>
              <p className="text-center text-sm"><Link to="/login" className="text-[hsl(221.2,83.2%,53.3%)] hover:underline">Back to Login</Link></p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}