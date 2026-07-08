import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useList, useCreate, useDelete, useUpload } from '@/hooks/useApi';
import {
  NotebookPen, Plus, Loader2, Trash2, X, Check, Camera, CloudRain,
  Sun, CloudFog, Zap, Cloud, Users, Truck, FileDown, ImageOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { DailyProgress, Project } from '@/types';
import { formatDate } from '@/lib/utils';

const WEATHER_OPTIONS = [
  { value: 'Sunny', icon: Sun },
  { value: 'Cloudy', icon: Cloud },
  { value: 'Rainy', icon: CloudRain },
  { value: 'Stormy', icon: Zap },
  { value: 'Foggy', icon: CloudFog },
];

export default function SiteDiaryPage() {
  const [showForm, setShowForm] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState('Sunny');
  const [temperature, setTemperature] = useState('');
  const [labourCount, setLabourCount] = useState('');
  const [equipmentCount, setEquipmentCount] = useState('');
  const [materialUsed, setMaterialUsed] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: projectsResponse } = useList<Project>('/projects', ['projects']);
  const projects = projectsResponse?.data || [];
  const projectName = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [projects]);

  const { data: response, isLoading, refetch } = useList<DailyProgress>('/daily-progress', ['daily-progress']);
  const createMutation = useCreate<DailyProgress>('/daily-progress', ['daily-progress'], 'Site diary entry saved');
  const deleteMutation = useDelete('/daily-progress', ['daily-progress'], 'Entry deleted');
  const uploadMutation = useUpload<{ url: string }>('/uploads', ['daily-progress']);

  const entries = response?.data || [];

  const resetForm = () => {
    setProjectId(''); setDate(new Date().toISOString().slice(0, 10)); setWeather('Sunny');
    setTemperature(''); setLabourCount(''); setEquipmentCount(''); setMaterialUsed(''); setWorkDone(''); setPhotos([]);
  };

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
      formData.append('folder', 'site-diary');
      try {
        const result = await uploadMutation.mutateAsync({ formData });
        if (result.data?.url) setPhotos((prev) => [...prev, result.data!.url]);
      } catch {}
    }
    setIsUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!projectId) { toast.error('Select a project'); return; }
    if (!workDone.trim()) { toast.error('Describe the work done today'); return; }
    if (!labourCount || !equipmentCount) { toast.error('Enter labour and equipment counts'); return; }
    try {
      await createMutation.mutateAsync({
        projectId,
        date: new Date(date),
        weather,
        temperature: temperature ? parseFloat(temperature) : undefined,
        labourCount: parseInt(labourCount),
        equipmentCount: parseInt(equipmentCount),
        materialUsed: materialUsed || undefined,
        workDone,
        photos,
      });
      setShowForm(false);
      resetForm();
      refetch();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); setDeleteConfirm(null); refetch(); } catch {}
  };

  // A lightweight, dependency-free "report" — a CSV of every logged day,
  // which opens cleanly in Excel/Sheets for printing or sharing.
  const handleExportReport = () => {
    if (entries.length === 0) { toast.error('No entries to export yet'); return; }
    const header = ['Date', 'Project', 'Weather', 'Temp (°C)', 'Labour', 'Equipment', 'Material Used', 'Work Done'];
    const rows = entries.map((e) => [
      formatDate(e.date), projectName[e.projectId] || e.projectId, e.weather,
      e.temperature ?? '', e.labourCount, e.equipmentCount,
      (e.materialUsed || '').replace(/,/g, ';'), (e.workDone || '').replace(/,/g, ';'),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-diary-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const WeatherIcon = (w: string) => (WEATHER_OPTIONS.find((o) => o.value === w) || WEATHER_OPTIONS[0]).icon;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Site Diary</h1>
          <p className="text-[hsl(var(--muted-foreground))]">{entries.length} daily entries logged</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <FileDown size={16} className="mr-1" /> Generate Report
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-1" /> {showForm ? 'Cancel' : 'New Entry'}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Log Today's Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Project *"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Select project..."
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
              />
              <Input label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Select
                label="Weather"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                options={WEATHER_OPTIONS.map((o) => ({ label: o.value, value: o.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Temperature (°C)" type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="e.g. 32" />
              <Input label="Workers on Site *" type="number" value={labourCount} onChange={(e) => setLabourCount(e.target.value)} placeholder="e.g. 24" />
              <Input label="Equipment on Site *" type="number" value={equipmentCount} onChange={(e) => setEquipmentCount(e.target.value)} placeholder="e.g. 3" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Materials Used</label>
              <textarea className="w-full rounded-lg border border-[hsl(var(--input))] bg-transparent p-3 text-sm" rows={2}
                value={materialUsed} onChange={(e) => setMaterialUsed(e.target.value)} placeholder="e.g. 40 bags cement, 5 m³ sand" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Work Done Today *</label>
              <textarea className="w-full rounded-lg border border-[hsl(var(--input))] bg-transparent p-3 text-sm" rows={3}
                value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="Describe today's progress..." />
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
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photos.map((url) => (
                    <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={url} alt="Site photo" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotos((prev) => prev.filter((u) => u !== url))}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
              Save Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : entries.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]">
          <NotebookPen className="mx-auto h-12 w-12 mb-3 opacity-50" /><p>No site diary entries yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => {
            const Icon = WeatherIcon(entry.weather);
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{formatDate(entry.date)}</h3>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {projectName[entry.projectId] || 'Unknown project'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                          <span className="flex items-center gap-1"><Icon size={12} /> {entry.weather}{entry.temperature ? ` · ${entry.temperature}°C` : ''}</span>
                          <span className="flex items-center gap-1"><Users size={12} /> {entry.labourCount} workers</span>
                          <span className="flex items-center gap-1"><Truck size={12} /> {entry.equipmentCount} equipment</span>
                        </div>
                        <p className="text-sm mt-2 line-clamp-2">{entry.workDone}</p>
                        {entry.photos && entry.photos.length > 0 ? (
                          <div className="flex gap-1 mt-2">
                            {entry.photos.slice(0, 4).map((url, i) => (
                              <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover" />
                            ))}
                            {entry.photos.length > 4 && (
                              <div className="w-10 h-10 rounded bg-[hsl(var(--secondary))] flex items-center justify-center text-xs font-medium">
                                +{entry.photos.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                            <ImageOff size={12} /> No photos
                          </div>
                        )}
                      </div>
                      {deleteConfirm === entry.id ? (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className="text-red-500"><Check size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(null)}><X size={14} /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(entry.id)} className="text-red-500 shrink-0"><Trash2 size={14} /></Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
