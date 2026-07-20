import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.getSettings().then(res => {
      const s = res.data.data;
      setForm({
        websiteName: s.websiteName || '',
        contactEmail: s.contactEmail || '',
        contactPhone: s.contactPhone || '',
        address: s.address || '',
        maintenanceMode: s.maintenanceMode || false,
        maintenanceMessage: s.maintenanceMessage || '',
        theme: s.theme || 'light',
        primaryColor: s.primaryColor || '#2563eb',
        facebookUrl: s.facebookUrl || '',
        twitterUrl: s.twitterUrl || '',
        linkedinUrl: s.linkedinUrl || '',
        instagramUrl: s.instagramUrl || '',
        youtubeUrl: s.youtubeUrl || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateSettings(form);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 skeleton" /><div className="grid grid-cols-2 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}</div></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500 mt-1">Manage site configuration</p></div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">General Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Website Name</label>
              <input type="text" value={form.websiteName} onChange={e => setForm({ ...form, websiteName: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input type="text" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="input-field" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Appearance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} className="input-field">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Social Links</h2>
          <div className="grid grid-cols-2 gap-4">
            {['facebookUrl', 'twitterUrl', 'linkedinUrl', 'instagramUrl', 'youtubeUrl'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('Url', ' URL').replace(/([A-Z])/g, ' $1').trim()}</label>
                <input type="url" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="input-field" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Maintenance Mode</h2>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="maintenance" checked={form.maintenanceMode} onChange={e => setForm({ ...form, maintenanceMode: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="maintenance" className="text-sm text-gray-700">Enable Maintenance Mode</label>
          </div>
          {form.maintenanceMode && (
            <textarea placeholder="Maintenance message" value={form.maintenanceMessage} onChange={e => setForm({ ...form, maintenanceMessage: e.target.value })} rows={2} className="input-field" />
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}