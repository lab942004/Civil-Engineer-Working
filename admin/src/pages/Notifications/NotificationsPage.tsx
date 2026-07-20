import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../lib/utils';
import { Plus, Trash2, Bell, ChevronLeft, ChevronRight, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getNotifications({ page, limit: 20 });
      setNotifications(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete notification?')) return;
    try { await adminAPI.deleteNotification(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-gray-500 mt-1">Send and manage broadcast notifications</p></div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md"><Plus size={16} /> Send Notification</button>
      </div>

      <div className="space-y-3">
        {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl skeleton" />) :
          notifications.map((n) => (
            <div key={n.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><Bell size={18} className="text-blue-500" /></div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="badge badge-blue">{n.type}</span>
                    <span className="badge badge-gray">{n.audience}</span>
                    <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
            </div>
          ))
        }
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {showForm && <NotificationForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function NotificationForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', message: '', type: 'ANNOUNCEMENT', audience: 'ALL', roleFilter: '', recipientIds: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAPI.createNotification({
        ...form,
        recipientIds: form.audience === 'SELECTED_USERS' ? form.recipientIds.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      toast.success('Notification sent');
      onSuccess();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Send Notification</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="input-field" />
          <textarea placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={3} className="input-field" />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="NEW_MATERIAL">New Material</option>
            <option value="NEW_ISCODE">New IS Code</option>
            <option value="LEARNING_UPDATE">Learning Update</option>
            <option value="GENERAL">General</option>
          </select>
          <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="input-field">
            <option value="ALL">All Users</option>
            <option value="ROLE_BASED">Role Based</option>
            <option value="SELECTED_USERS">Selected Users</option>
          </select>
          {form.audience === 'ROLE_BASED' && (
            <select value={form.roleFilter} onChange={e => setForm({ ...form, roleFilter: e.target.value })} className="input-field">
              <option value="">Select Role</option>
              <option value="CIVIL_ENGINEER">Civil Engineer</option>
              <option value="SITE_ENGINEER">Site Engineer</option>
              <option value="STUDENT">Student</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="CLIENT">Client</option>
            </select>
          )}
          {form.audience === 'SELECTED_USERS' && (
            <input type="text" placeholder="User IDs (comma separated)" value={form.recipientIds} onChange={e => setForm({ ...form, recipientIds: e.target.value })} className="input-field" />
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Send size={14} /> {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}