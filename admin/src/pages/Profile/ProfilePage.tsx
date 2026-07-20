import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Save, Key, User, Mail, Shield, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await updateProfile(form); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setChangingPassword(true);
    try {
      await adminAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setChangingPassword(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div><h1 className="text-2xl font-bold text-gray-900">Profile</h1><p className="text-gray-500 mt-1">Manage your account</p></div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-purple">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User size={16} /> Edit Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (read only)</label>
            <input type="email" value={user?.email} disabled className="input-field bg-gray-50 opacity-70 cursor-not-allowed" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} className="input-field" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Key size={16} /> Change Password</h3>
        <div className="space-y-3">
          <input type="password" placeholder="Current Password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="input-field" />
          <div className="grid grid-cols-2 gap-4">
            <input type="password" placeholder="New Password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className="input-field" />
            <input type="password" placeholder="Confirm Password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="input-field" />
          </div>
        </div>
        <button type="submit" disabled={changingPassword} className="btn-primary flex items-center gap-2">
          <Key size={14} /> {changingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}