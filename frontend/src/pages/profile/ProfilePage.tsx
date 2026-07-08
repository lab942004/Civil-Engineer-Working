import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Save, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { User } from '@/types';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await api.put<User>('/profile/update', { name, phone, bio });
      if (response.data) {
        setUser(response.data);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // BUG FIX: the camera button used to render but had no onClick at all —
  // it was purely decorative. It now actually uploads to Cloudinary via the
  // shared /uploads/avatar endpoint and updates the user's profile picture.
  const handleAvatarClick = () => avatarInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      toast.error('Please choose an image file (jpg, png, webp, or gif)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.upload<Pick<User, 'id' | 'name' | 'email' | 'avatar'>>('/uploads/avatar', formData);
      if (response.data) {
        setUser({ ...user!, avatar: response.data.avatar });
        toast.success('Profile picture updated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="relative inline-block">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[hsl(221.2,83.2%,53.3%)] flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.split(' ')?.map((n) => n[0])?.join('')?.toUpperCase()?.slice(0, 2) || 'CE'}
                </div>
              )}
              <input ref={avatarInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif"
                className="hidden" onChange={handleAvatarChange} />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[hsl(var(--primary))] text-white disabled:opacity-60"
              >
                {isUploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <div>
              <h2 className="font-semibold">{user?.name || 'Engineer'}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{user?.role?.replace(/_/g, ' ') || 'Civil Engineer'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email" type="email" value={email} disabled />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Role" value={user?.role?.replace(/_/g, ' ') || 'CIVIL_ENGINEER'} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea className="w-full rounded-lg border border-[hsl(var(--input))] bg-transparent p-3 text-sm" rows={3}
                value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-1" size={16} /> : <Save size={16} className="mr-1" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
