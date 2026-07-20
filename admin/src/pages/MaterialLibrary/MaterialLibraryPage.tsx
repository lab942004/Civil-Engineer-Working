import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../lib/utils';
import { Search, Plus, Edit, Trash2, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../../components/FileUpload';

export default function MaterialLibraryPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => { loadMaterials(); }, [search, category, page]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getMaterials({ search, category, page, limit });
      setMaterials(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await adminAPI.deleteMaterial(id);
      toast.success('Deleted');
      loadMaterials();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Library</h1>
          <p className="text-gray-500 mt-1">Manage construction materials</p>
        </div>
        <button onClick={() => { setEditId(null); setShowForm(true); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md">
          <Plus size={16} /> Add Material
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search materials..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
          <option value="">All Categories</option>
          <option value="CEMENT">Cement</option>
          <option value="SAND">Sand</option>
          <option value="AGGREGATE">Aggregate</option>
          <option value="STEEL">Steel</option>
          <option value="BRICKS">Bricks</option>
          <option value="BLOCKS">Blocks</option>
          <option value="TILES">Tiles</option>
          <option value="WOOD">Wood</option>
          <option value="GLASS">Glass</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-xl skeleton" />) :
          materials.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BookOpen size={20} className="text-blue-500" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(m.id); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">{m.name}</h3>
              <span className="badge badge-gray">{m.category}</span>
              <p className="text-xs text-gray-400 mt-2">{formatDate(m.createdAt)}</p>
            </div>
          ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {showForm && <MaterialForm materialId={editId} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); loadMaterials(); }} />}
    </div>
  );
}

function MaterialForm({ materialId, onClose, onSuccess }: { materialId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', slug: '', category: 'CEMENT', description: '', uses: '', advantages: '', disadvantages: '', pdfCatalog: '', images: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (materialId) {
      adminAPI.getMaterials({}).then(res => {
        const m = res.data.data.find((x: any) => x.id === materialId);
        if (m) setForm({ name: m.name, slug: m.slug, category: m.category, description: m.description || '', uses: (m.uses || []).join(', '), advantages: (m.advantages || []).join(', '), disadvantages: (m.disadvantages || []).join(', '), pdfCatalog: m.pdfCatalog || '', images: (m.images || []).join(', ') });
      });
    }
  }, [materialId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        description: form.description,
        uses: form.uses.split(',').map(s => s.trim()).filter(Boolean),
        advantages: form.advantages.split(',').map(s => s.trim()).filter(Boolean),
        disadvantages: form.disadvantages.split(',').map(s => s.trim()).filter(Boolean),
        pdfCatalog: form.pdfCatalog || undefined,
        images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (materialId) {
        await adminAPI.updateMaterial(materialId, data);
        toast.success('Updated');
      } else {
        await adminAPI.createMaterial(data);
        toast.success('Created');
      }
      onSuccess();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{materialId ? 'Edit Material' : 'Add Material'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="col-span-2 input-field" />
            <input type="text" placeholder="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input-field" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
              <option value="CEMENT">Cement</option>
              <option value="SAND">Sand</option>
              <option value="AGGREGATE">Aggregate</option>
              <option value="STEEL">Steel</option>
              <option value="BRICKS">Bricks</option>
              <option value="BLOCKS">Blocks</option>
              <option value="TILES">Tiles</option>
              <option value="WOOD">Wood</option>
              <option value="GLASS">Glass</option>
            </select>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field" />
          <textarea placeholder="Uses (comma separated)" value={form.uses} onChange={e => setForm({ ...form, uses: e.target.value })} rows={2} className="input-field" />
          <textarea placeholder="Advantages (comma separated)" value={form.advantages} onChange={e => setForm({ ...form, advantages: e.target.value })} rows={2} className="input-field" />
          <textarea placeholder="Disadvantages (comma separated)" value={form.disadvantages} onChange={e => setForm({ ...form, disadvantages: e.target.value })} rows={2} className="input-field" />
          <FileUpload
            onUpload={(result) => setForm({ ...form, pdfCatalog: result.url })}
            onRemove={() => setForm({ ...form, pdfCatalog: '' })}
            currentUrl={form.pdfCatalog}
            label="PDF Catalog"
            folder="materials/catalogs"
            accept="application/pdf"
          />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : materialId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}