import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.string().min(1, 'Please select a role'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const roleOptions = [
  { label: 'Civil Engineer', value: 'CIVIL_ENGINEER' },
  { label: 'Site Engineer', value: 'SITE_ENGINEER' },
  { label: 'Structural Engineer', value: 'STRUCTURAL_ENGINEER' },
  { label: 'Student', value: 'STUDENT' },
  { label: 'Contractor', value: 'CONTRACTOR' },
  { label: 'Client', value: 'CLIENT' },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      if (response.data) {
        toast.success('Account created! Please check your email for a verification code.');
        navigate('/verify-email', { state: { email: data.email } });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[hsl(221.2,83.2%,53.3%)] flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xl">CE</span>
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Join the Civil Engineering platform
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Select label="Role" options={roleOptions} placeholder="Select your role" error={errors.role?.message} {...register('role')} />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-[hsl(var(--muted-foreground))]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input label="Confirm Password" type="password" placeholder="Confirm your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            Already have an account?{' '}
            <Link to="/login" className="text-[hsl(221.2,83.2%,53.3%)] hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}