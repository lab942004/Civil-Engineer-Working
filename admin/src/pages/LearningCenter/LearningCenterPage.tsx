import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../lib/utils';
import { Search, Plus, Edit, Trash2, BookOpen, Video, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../../components/FileUpload';

export default function LearningCenterPage() {
  const [tab, setTab] = useState<'articles' | 'tutorials'>('articles');
  const [articles, setArticles] = useState<any[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (tab === 'articles') loadArticles();
    else loadTutorials();
  }, [tab, search, page]);

  const loadArticles = async () => {
    try {
      const res = await adminAPI.getArticles({ search, page, limit: 20 });
      setArticles(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const loadTutorials = async () => {
    try {
      const res = await adminAPI.getTutorials({ search, page, limit: 20 });
      setTutorials(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try { await adminAPI.deleteArticle(id); toast.success('Deleted'); loadArticles(); }
    catch { toast.error('Failed'); }
  };

  const handleDeleteTutorial = async (id: string) => {
    if (!confirm('Delete this tutorial?')) return;
    try { await adminAPI.deleteTutorial(id); toast.success('Deleted'); loadTutorials(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
          <p className="text-gray-500 mt-1">Manage articles and tutorials</p>
        </div>
        <button onClick={() => { setEditId(null); setShowForm(true); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md">
          <Plus size={16} /> Add {tab === 'articles' ? 'Article' : 'Tutorial'}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => { setTab('articles'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'articles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Articles</button>
        <button onClick={() => { setTab('tutorials'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'tutorials' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tutorials</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>

      {tab === 'articles' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-5 skeleton w-full" /></td>)}</tr>) :
                articles.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{a.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{a.author || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditId(a.id); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteArticle(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-5 skeleton w-full" /></td>)}</tr>) :
                tutorials.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.category}</td>
                    <td className="px-4 py-3"><span className="badge badge-gray">{t.difficulty}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditId(t.id); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteTutorial(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {showForm && (
        <LearningForm type={tab} itemId={editId} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); tab === 'articles' ? loadArticles() : loadTutorials(); }} />
      )}
    </div>
  );
}

function LearningForm({ type, itemId, onClose, onSuccess }: { type: 'articles' | 'tutorials'; itemId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<any>({ title: '', content: '', excerpt: '', category: '', author: '', imageUrl: '', readTime: '', tags: '', description: '', videoUrl: '', duration: '', difficulty: 'BEGINNER' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (itemId) {
      const fetcher = type === 'articles' ? adminAPI.getArticles({}) : adminAPI.getTutorials({});
      fetcher.then(res => {
        const item = res.data.data.find((x: any) => x.id === itemId);
        if (item) {
          if (type === 'articles') setForm({ title: item.title, content: item.content || '', excerpt: item.excerpt || '', category: item.category, author: item.author || '', imageUrl: item.imageUrl || '', readTime: item.readTime?.toString() || '', tags: (item.tags || []).join(', '), description: '', videoUrl: '', duration: '', difficulty: 'BEGINNER' });
          else setForm({ title: item.title, content: '', excerpt: '', category: item.category, author: '', imageUrl: '', readTime: '', tags: '', description: item.description || '', videoUrl: item.videoUrl || '', duration: item.duration?.toString() || '', difficulty: item.difficulty || 'BEGINNER' });
        }
      });
    }
  }, [itemId, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data: any;
      if (type === 'articles') {
        data = { title: form.title, content: form.content, excerpt: form.excerpt, category: form.category, author: form.author, imageUrl: form.imageUrl, readTime: form.readTime ? parseInt(form.readTime) : undefined, tags: form.tags.split(',').map((s: string) => s.trim()).filter(Boolean) };
        if (itemId) { await adminAPI.updateArticle(itemId, data); toast.success('Updated'); }
        else { await adminAPI.createArticle(data); toast.success('Created'); }
      } else {
        data = { title: form.title, description: form.description, videoUrl: form.videoUrl, duration: form.duration ? parseInt(form.duration) : undefined, difficulty: form.difficulty, category: form.category };
        if (itemId) { await adminAPI.updateTutorial(itemId, data); toast.success('Updated'); }
        else { await adminAPI.createTutorial(data); toast.success('Created'); }
      }
      onSuccess();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{itemId ? 'Edit' : 'Add'} {type === 'articles' ? 'Article' : 'Tutorial'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="input-field" />
          <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="input-field" />
          {type === 'articles' ? (
            <>
              <textarea placeholder="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="input-field" />
              <input type="text" placeholder="Excerpt" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="input-field" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="input-field" />
                <input type="number" placeholder="Read Time (min)" value={form.readTime} onChange={e => setForm({ ...form, readTime: e.target.value })} className="input-field" />
              </div>
              <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field" />
              <FileUpload
                onUpload={(result) => setForm({ ...form, imageUrl: result.url })}
                onRemove={() => setForm({ ...form, imageUrl: '' })}
                currentUrl={form.imageUrl}
                label="Article Image"
                folder="learning/articles"
                accept="image/*"
              />
            </>
          ) : (
            <>
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field" />
              <FileUpload
                onUpload={(result) => setForm({ ...form, videoUrl: result.url })}
                onRemove={() => setForm({ ...form, videoUrl: '' })}
                currentUrl={form.videoUrl}
                label="Tutorial Video"
                folder="learning/tutorials"
                accept="video/*,.mp4,.webm,.ogg"
              />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Duration (min)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="input-field" />
                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="input-field">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : itemId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}