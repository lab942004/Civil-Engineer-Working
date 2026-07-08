import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/themeStore';
import { api } from '@/services/api';
import { Settings, Moon, Sun, Bell, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { isDark, toggle } = useThemeStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await api.put('/profile/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Settings size={18} /> General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
                <span className="text-sm">Dark Mode</span>
              </div>
              <button onClick={toggle} className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-[hsl(221.2,83.2%,53.3%)]' : 'bg-[hsl(var(--input))]'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <Input label="Language" defaultValue="English (India)" />
            <Input label="Timezone" defaultValue="Asia/Kolkata (UTC+5:30)" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Bell size={18} /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['Email Notifications', 'Push Notifications', 'Project Updates', 'Daily Reports'].map((n) => (
              <div key={n} className="flex items-center justify-between">
                <span className="text-sm">{n}</span>
                <button className="relative w-12 h-6 rounded-full bg-[hsl(var(--input))]"><div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow translate-x-0.5" /></button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Lock size={18} /> Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Current Password" type="password" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)} />
            <Input label="New Password" type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} />
            <Input label="Confirm New Password" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}