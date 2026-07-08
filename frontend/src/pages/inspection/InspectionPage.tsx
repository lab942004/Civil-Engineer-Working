import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useList, useCreate, useDelete, useUpload } from '@/hooks/useApi';
import { ClipboardCheck, Plus, Search, CheckCircle2, XCircle, Loader2, Trash2, X, Check, Camera, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Inspection, InspectionItem } from '@/types';
import { formatDate } from '@/lib/utils';

export default function InspectionPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [inspector, setInspector] = useState('');
  const [safetyRating, setSafetyRating] = useState(5);
  const [checklist, setChecklist] = useState<{ description: string; isPassed: boolean; remarks: string }[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: response, isLoading, refetch } = useList<Inspection>('/inspections', ['inspections'], { search: search || undefined });
  const createMutation = useCreate<Inspection>('/inspections', ['inspections'], 'Inspection created');
  const deleteMutation = useDelete('/inspections', ['inspections'], 'Inspection deleted');
  const uploadMutation = useUpload<{ url: string }>('/uploads', ['inspections']);

  const inspections = response?.data || [];

  // BUG FIX: the Inspection model has an `images: string[]` field for site
  // photos, but the form always submitted `images: []` — there was no photo
  // capture UI at all. Photos now upload to Cloudinary via the shared
  // /uploads endpoint and their URLs get attached to the inspection.
  const handlePhotoClick = () => photoInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        toast.error(`${file.name}: only image files are allowed`);
        continue;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'inspections');
      try {
        const result = await uploadMutation.mutateAsync({ formData });
        if (result.data?.url) setImages((prev) => [...prev, result.data!.url]);
      } catch {
        // useUpload already toasts the specific error
      }
    }
    setIsUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

  const addChecklistItem = () => {
    setChecklist([...checklist, { description: '', isPassed: true, remarks: '' }]);
  };

  const updateChecklistItem = (index: number, field: string, value: any) => {
    const updated = [...checklist];
    (updated[index] as any)[field] = value;
    setChecklist(updated);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!inspector.trim()) { toast.error('Inspector name is required'); return; }
    const validItems = checklist.filter((c) => c.description.trim());
    if (validItems.length === 0) { toast.error('Add at least one checklist item'); return; }
    try {
      await createMutation.mutateAsync({
        title, inspector, safetyRating, date: new Date(),
        checklist: validItems, images, status: 'PENDING',
      });
      setShowForm(false); setTitle(''); setInspector(''); setSafetyRating(5); setChecklist([]); setImages([]);
      refetch();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); setDeleteConfirm(null); refetch(); } catch {}
  };

  const passedCount = (inspection: Inspection) => inspection.checklist?.filter((c) => c.isPassed).length || 0;
  const totalCount = (inspection: Inspection) => inspection.checklist?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Site Inspection</h1><p className="text-[hsl(var(--muted-foreground))]">{inspections.length} inspections</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus size={16} className="mr-1" /> {showForm ? 'Cancel' : 'New Inspection'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Create Inspection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Inspection title" />
              <Input label="Inspector *" value={inspector} onChange={(e) => setInspector(e.target.value)} placeholder="Inspector name" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Safety Rating (1-10)</label>
              <input type="range" min="1" max="10" value={safetyRating} onChange={(e) => setSafetyRating(parseInt(e.target.value))} className="w-full" />
              <span className="text-sm">{safetyRating}/10</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Checklist</label>
                <Button variant="outline" size="sm" onClick={addChecklistItem}><Plus size={14} className="mr-1" /> Add Item</Button>
              </div>
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <Input value={item.description} onChange={(e) => updateChecklistItem(i, 'description', e.target.value)} placeholder="Item description" className="flex-1" />
                  <button onClick={() => updateChecklistItem(i, 'isPassed', !item.isPassed)} className={`p-1 rounded ${item.isPassed ? 'text-green-500' : 'text-red-500'}`}>
                    {item.isPassed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => removeChecklistItem(i)} className="text-red-500"><X size={16} /></Button>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Site Photos</label>
                <input ref={photoInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.gif"
                  className="hidden" onChange={handlePhotoChange} />
                <Button variant="outline" size="sm" onClick={handlePhotoClick} disabled={isUploadingPhoto}>
                  {isUploadingPhoto ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Camera size={14} className="mr-1" />}
                  Add Photos
                </Button>
              </div>
              {images.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {images.map((url) => (
                    <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={url} alt="Site photo" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(url)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">No photos attached yet.</p>
              )}
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
              Create Inspection
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
        <Input placeholder="Search inspections..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> : inspections.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]"><ClipboardCheck className="mx-auto h-12 w-12 mb-3 opacity-50" /><p>No inspections yet.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inspections.map((inspection) => (
            <motion.div key={inspection.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-[hsl(221.2,83.2%,53.3%)]/10"><ClipboardCheck size={20} className="text-[hsl(221.2,83.2%,53.3%)]" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{inspection.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                          <span>👤 {inspection.inspector}</span>
                          <span>📅 {inspection.date ? formatDate(inspection.date) : ''}</span>
                          {inspection.safetyRating && <span>🛡️ {inspection.safetyRating}/10</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            inspection.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            inspection.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                            inspection.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{inspection.status}</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {passedCount(inspection)}/{totalCount(inspection)} passed
                          </span>
                        </div>
                        {inspection.images && inspection.images.length > 0 ? (
                          <div className="flex gap-1 mt-2">
                            {inspection.images.slice(0, 4).map((url, i) => (
                              <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover" />
                            ))}
                            {inspection.images.length > 4 && (
                              <div className="w-10 h-10 rounded bg-[hsl(var(--secondary))] flex items-center justify-center text-xs font-medium">
                                +{inspection.images.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                            <ImageOff size={12} /> No photos
                          </div>
                        )}
                      </div>
                    </div>
                    {deleteConfirm === inspection.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(inspection.id)} className="text-red-500"><Check size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(null)}><X size={14} /></Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(inspection.id)} className="text-red-500"><Trash2 size={14} /></Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}