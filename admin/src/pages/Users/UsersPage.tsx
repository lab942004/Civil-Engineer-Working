import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate, getInitials } from '../../lib/utils';
import { Search, Plus, Edit, Trash2, UserX, UserCheck, Key, ChevronLeft, ChevronRight, Mail, Phone, Calendar, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  _count: { projects: number; downloads: number; notes: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ search, role: roleFilter, status: statusFilter, page, limit });
      setUsers(res.data.data);
      setTotal(res.data.meta.total);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Suspend this user?')) return;
    try {
      await adminAPI.suspendUser(id);
      toast.success('User suspended');
      loadUsers();
    } catch { toast.error('Failed'); }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminAPI.activateUser(id);
      toast.success('User activated');
      loadUsers();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      loadUsers();
    } catch { toast.error('Failed'); }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Enter new password (min 6 chars):');
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await adminAPI.resetUserPassword(id, newPassword);
      toast.success('Password reset successfully');
    } catch { toast.error('Failed'); }
  };

  if (showDetail) {
    return <UserDetail userId={showDetail} onBack={() => setShowDetail(null)} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">{total} total users</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="CIVIL_ENGINEER">Civil Engineer</option>
          <option value="SITE_ENGINEER">Site Engineer</option>
          <option value="STRUCTURAL_ENGINEER">Structural Engineer</option>
          <option value="STUDENT">Student</option>
          <option value="CONTRACTOR">Contractor</option>
          <option value="CLIENT">Client</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-5 skeleton w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setShowDetail(user.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
                          {getInitials(user.name)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                          ? 'badge-purple'
                          : 'badge-gray'
                      }`}>{user.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-xs ${user.isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {user.isVerified && <span className="badge badge-blue text-[10px]">Verified</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {user.isActive ? (
                          <button onClick={() => handleSuspend(user.id)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors" title="Suspend"><UserX size={14} /></button>
                        ) : (
                          <button onClick={() => handleActivate(user.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors" title="Activate"><UserCheck size={14} /></button>
                        )}
                        <button onClick={() => handleResetPassword(user.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Reset Password"><Key size={14} /></button>
                        <button onClick={() => setShowEditModal(user.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Edit"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {showCreateModal && <UserFormModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadUsers(); }} />}
      {showEditModal && <UserFormModal userId={showEditModal} onClose={() => setShowEditModal(null)} onSuccess={() => { setShowEditModal(null); loadUsers(); }} />}
    </div>
  );
}

function UserFormModal({ userId, onClose, onSuccess }: { userId?: string | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CIVIL_ENGINEER', phone: '', bio: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      adminAPI.getUser(userId).then(res => {
        const u = res.data.data;
        setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', bio: u.bio || '' });
      });
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (userId) {
        await adminAPI.updateUser(userId, { name: form.name, email: form.email, role: form.role, phone: form.phone, bio: form.bio });
        toast.success('User updated');
      } else {
        await adminAPI.createUser(form);
        toast.success('User created');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{userId ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="input-field" />
          {!userId && <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="input-field" />}
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
            <option value="CIVIL_ENGINEER">Civil Engineer</option>
            <option value="ADMIN">Admin</option>
            <option value="SITE_ENGINEER">Site Engineer</option>
            <option value="STRUCTURAL_ENGINEER">Structural Engineer</option>
            <option value="STUDENT">Student</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="CLIENT">Client</option>
          </select>
          <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
          <textarea placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={2} className="input-field" />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : userId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getUser(userId).then(res => setUser(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="py-12 text-center text-gray-400">Loading...</div>;
  if (!user) return <div className="py-12 text-center text-gray-400">User not found</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">← Back to Users</button>
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {getInitials(user.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl"><Shield size={16} className="text-gray-400 mb-1" /><p className="text-xs text-gray-500">Role</p><p className="text-sm font-medium text-gray-900">{user.role}</p></div>
          <div className="p-4 bg-gray-50 rounded-xl"><Calendar size={16} className="text-gray-400 mb-1" /><p className="text-xs text-gray-500">Joined</p><p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p></div>
          <div className="p-4 bg-gray-50 rounded-xl"><Phone size={16} className="text-gray-400 mb-1" /><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-900">{user.phone || 'N/A'}</p></div>
          <div className="p-4 bg-gray-50 rounded-xl"><Mail size={16} className="text-gray-400 mb-1" /><p className="text-xs text-gray-500">Verified</p><p className="text-sm font-medium text-gray-900">{user.isVerified ? 'Yes' : 'No'}</p></div>
        </div>
        {user.bio && <p className="mt-4 text-sm text-gray-600">{user.bio}</p>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: user._count?.projects || 0 },
          { label: 'Downloads', value: user._count?.downloads || 0 },
          { label: 'Notes', value: user._count?.notes || 0 },
          { label: 'Bookmarks', value: user._count?.bookmarks || 0 },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}