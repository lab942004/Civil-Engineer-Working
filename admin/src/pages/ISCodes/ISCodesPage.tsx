import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../lib/utils';
import { Search, Plus, Edit, Trash2, FileCode, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../../components/FileUpload';

export default function ISCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => { loadCodes(); }, [search, category, page]);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getISCodes({ search, category, page, limit });
      setCodes(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this IS code?')) return;
    try { await adminAPI.deleteISCode(id); toast.success('Deleted'); loadCodes(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IS Codes</h1>
          <p className="text-gray-500 mt-1">Manage Indian Standard codes</p>
        </div>
        <button onClick={() => { setEditId(null); setShowForm(true); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md">
          <Plus size={16} /> Add IS Code
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search codes..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
        <input type="text" placeholder="Category filter" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-5 skeleton w-full" /></td>)}</tr>) :
                codes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{c.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.year}</td>
                    <td className="px-4 py-3"><span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditId(c.id); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
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

      {showForm && <ISCodeForm codeId={editId} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); loadCodes(); }} />}
    </div>
  );
}

function ISCodeForm({ codeId, onClose, onSuccess }: { codeId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ code: '', title: '', category: '', description: '', year: new Date().getFullYear().toString(), pdfUrl: '', pages: '', status: 'ACTIVE' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (codeId) {
      adminAPI.getISCodes({}).then(res => {
        const c = res.data.data.find((x: any) => x.id === codeId);
        if (c) setForm({ code: c.code, title: c.title, category: c.category, description: c.description || '', year: c.year.toString(), pdfUrl: c.pdfUrl || '', pages: c.pages?.toString() || '', status: c.status });
      });
    }
  }, [codeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (codeId) { await adminAPI.updateISCode(codeId, form); toast.success('Updated'); }
      else { await adminAPI.createISCode(form); toast.success('Created'); }
      onSuccess();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{codeId ? 'Edit IS Code' : 'Add IS Code'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="IS Code (e.g. IS 456)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required className="input-field" />
            <input type="number" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required className="input-field" />
          </div>
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="input-field" />
          <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="input-field" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field" />
          <FileUpload
            onUpload={(result) => setForm({ ...form, pdfUrl: result.url })}
            onRemove={() => setForm({ ...form, pdfUrl: '' })}
            currentUrl={form.pdfUrl}
            label="PDF Document"
            folder="iscodes"
            accept="application/pdf"
          />
          <input type="number" placeholder="Pages" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} className="input-field" />
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REVISED">Revised</option>
          </select>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : codeId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}