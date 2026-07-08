import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { password: string }) => {
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center">Reset Password</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="New Password" type="password" placeholder="Enter new password" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password" type="password" placeholder="Confirm new password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : 'Reset Password'}</Button>
          </form>
          <p className="text-center text-sm"><Link to="/login" className="text-[hsl(221.2,83.2%,53.3%)] hover:underline">Back to Login</Link></p>
        </div>
      </motion.div>
    </div>
  );
}