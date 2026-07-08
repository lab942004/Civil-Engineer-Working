import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useList, useCreate, useUpdate, useDelete } from '@/hooks/useApi';
import { StickyNote, Plus, Search, Bookmark, Trash2, Edit3, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Note } from '@/types';

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: response, isLoading, refetch } = useList<Note>('/notes', ['notes'], { search: search || undefined });
  const createMutation = useCreate<Note>('/notes', ['notes'], 'Note created');
  const updateMutation = useUpdate<Note>('/notes', ['notes'], 'Note updated');
  const deleteMutation = useDelete('/notes', ['notes'], 'Note deleted');

  const notes = response?.data || [];

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    try {
      if (editingId) await updateMutation.mutateAsync({ id: editingId, data: { title, content, isBookmarked: false, tags: [] } });
      else await createMutation.mutateAsync({ title, content, isBookmarked: false, tags: [] });
      setShowEditor(false); setEditingId(null); setTitle(''); setContent('');
      refetch();
    } catch {}
  };

  const handleEdit = (note: Note) => {
    setTitle(note.title); setContent(note.content); setEditingId(note.id); setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); setDeleteConfirm(null); refetch(); } catch {}
  };

  const toggleBookmark = async (note: Note) => {
    try {
      await updateMutation.mutateAsync({ id: note.id, data: { isBookmarked: !note.isBookmarked } });
      refetch();
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Notes</h1><p className="text-[hsl(var(--muted-foreground))]">{notes.length} notes</p></div>
        <Button onClick={() => { setShowEditor(!showEditor); setEditingId(null); setTitle(''); setContent(''); }}>
          <Plus size={16} className="mr-1" /> {showEditor ? 'Cancel' : 'New Note'}
        </Button>
      </div>

      {showEditor && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">{editingId ? 'Edit Note' : 'Create Note'}</h3>
            <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
            <div className="space-y-1">
              <label className="text-sm font-medium">Content</label>
              <textarea className="w-full min-h-[200px] rounded-lg border border-[hsl(var(--input))] bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your note here..." />
            </div>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
              {editingId ? 'Update' : 'Save'} Note
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
        <Input placeholder="Search notes..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> : notes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]"><StickyNote className="mx-auto h-12 w-12 mb-3 opacity-50" /><p>No notes yet.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1 min-w-0" onClick={() => handleEdit(note)}>
                    <div className="p-2 rounded-lg bg-[hsl(221.2,83.2%,53.3%)]/10 shrink-0"><StickyNote size={20} className="text-[hsl(221.2,83.2%,53.3%)]" /></div>
                    <div className="flex-1 min-w-0 cursor-pointer">
                      <h3 className="font-medium text-sm truncate">{note.title}</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-3">{note.content}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => toggleBookmark(note)}>
                      <Bookmark size={14} className={note.isBookmarked ? 'text-yellow-500 fill-yellow-500' : ''} />
                    </Button>
                    {deleteConfirm === note.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)} className="text-red-500"><Check size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(null)}><X size={14} /></Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(note.id)} className="text-red-500"><Trash2 size={14} /></Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}