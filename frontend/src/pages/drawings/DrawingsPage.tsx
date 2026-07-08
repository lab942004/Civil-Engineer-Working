import { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useList, useUpload, useDelete } from '@/hooks/useApi';
import { api } from '@/services/api';
import {
  Image, Upload, Download, Trash2, X, FileText,
  Search, Grid3X3, List, FolderOpen, Tag, Calendar, HardDrive,
  Eye, FileDown, Plus, TrendingUp, Loader2, CloudUpload
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProjectFile } from '@/types';

interface RateItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
}

const IMAGE_EXTENSIONS = ['PNG', 'JPG', 'JPEG', 'TIF', 'TIFF', 'BMP', 'GIF', 'WEBP', 'SVG'];
const CATEGORIES = ['Structural', 'Architectural', 'MEP', 'Site Plan', 'Section', 'Elevation', 'Other'];
const FOLDER = 'drawings';

function isImageType(type: string) {
  return IMAGE_EXTENSIONS.includes(type.toUpperCase());
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DrawingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingRateDrawings, setEditingRateDrawings] = useState<Set<string>>(new Set());
  const [uploadingCount, setUploadingCount] = useState(0);

  // BUG FIX (per request): drawings used to live only in the browser's
  // IndexedDB — invisible to teammates, gone if you cleared browser data or
  // switched devices. They now live in Postgres + Cloudinary, same as every
  // other file in the app, via the shared /uploads endpoint.
  const { data: response, isLoading, refetch } = useList<ProjectFile>('/uploads', ['drawings'], { folder: FOLDER, limit: 200 });
  const uploadMutation = useUpload<ProjectFile>('/uploads', ['drawings']);
  const deleteMutation = useDelete('/uploads', ['drawings'], 'Drawing deleted');

  const drawings = useMemo(() => response?.data || [], [response]);

  // Debounced, silent metadata saves (category / notes / rate items) so
  // typing in a rate-analysis field doesn't fire a network request (and a
  // "Saved!" toast) on every keystroke. Each drawing gets its own timer.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [pendingMeta, setPendingMeta] = useState<Record<string, Partial<ProjectFile>>>({});

  const scheduleMetaSave = (id: string, updates: Partial<Pick<ProjectFile, 'category' | 'notes' | 'rateItems'>>) => {
    setPendingMeta((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      const merged = { ...pendingMeta[id], ...updates };
      try {
        await api.put(`/uploads/${id}`, merged);
        refetch();
      } catch {
        toast.error('Failed to save changes');
      } finally {
        setPendingMeta((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    }, 600);
  };

  // Merge in-flight local edits over the server data so the UI feels
  // instant while the debounced save is still pending.
  const withPending = (d: ProjectFile): ProjectFile => ({ ...d, ...pendingMeta[d.id] });

  const filteredDrawings = drawings.map(withPending).filter((d) => {
    const matchesSearch = d.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.format.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(drawings.map((d) => d.category).filter(Boolean)))] as string[];
  const previewDrawing = previewId ? filteredDrawings.find((d) => d.id === previewId) || drawings.map(withPending).find((d) => d.id === previewId) : null;

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCount(files.length);
    let succeeded = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', FOLDER);
      formData.append('category', 'Other');
      try {
        await uploadMutation.mutateAsync({ formData });
        succeeded++;
      } catch {
        // useUpload already toasts the specific error (size/type/etc.)
      }
    }
    setUploadingCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (succeeded > 0) refetch();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (previewId === id) setPreviewId(null);
    } catch {}
  };

  const handleDownload = (drawing: ProjectFile) => {
    const a = document.createElement('a');
    a.href = drawing.url;
    a.download = drawing.originalName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const updateCategory = (id: string, category: string) => scheduleMetaSave(id, { category });

  const toggleRateAnalysis = (id: string) => {
    setEditingRateDrawings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addRateItem = (drawing: ProjectFile) => {
    const newItem: RateItem = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      name: '', unit: 'nos', quantity: 1, rate: 0,
    };
    scheduleMetaSave(drawing.id, { rateItems: [...(drawing.rateItems || []), newItem] });
  };

  const updateRateItem = (drawing: ProjectFile, itemId: string, updates: Partial<RateItem>) => {
    const items = (drawing.rateItems || []).map((item) => (item.id === itemId ? { ...item, ...updates } : item));
    scheduleMetaSave(drawing.id, { rateItems: items });
  };

  const removeRateItem = (drawing: ProjectFile, itemId: string) => {
    scheduleMetaSave(drawing.id, { rateItems: (drawing.rateItems || []).filter((x) => x.id !== itemId) });
  };

  const getFileIcon = (type: string, size: number = 40) => {
    const t = type.toUpperCase();
    if (['PDF'].includes(t)) return <FileText size={size} className="text-red-400" />;
    if (['DWG', 'DXF', 'DGN'].includes(t)) return <FileText size={size} className="text-blue-400" />;
    return <Image size={size} className="text-[hsl(var(--muted-foreground))]" />;
  };

  const getCardBg = (type: string) => {
    const t = type.toUpperCase();
    if (['PDF'].includes(t)) return 'bg-red-50 dark:bg-red-950/20';
    if (['DWG', 'DXF', 'DGN'].includes(t)) return 'bg-blue-50 dark:bg-blue-950/20';
    return 'bg-[hsl(var(--secondary))]';
  };

  const getTypeColor = (type: string) => {
    const t = type.toUpperCase();
    if (['PDF'].includes(t)) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950';
    if (['DWG', 'DXF', 'DGN'].includes(t)) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950';
    if (['PNG', 'JPG', 'JPEG'].includes(t)) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950';
    return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  };

  const getTotalRate = (d: ProjectFile) => (d.rateItems || []).reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const dateOf = (d: ProjectFile) => new Date(d.createdAt).toLocaleDateString('en-IN');

  // Stats
  const totalDrawings = drawings.length;
  const imageDrawings = drawings.filter((d) => isImageType(d.format)).length;
  const cadDrawings = drawings.filter((d) => ['DWG', 'DXF', 'DGN'].includes(d.format.toUpperCase())).length;
  const pdfDrawings = drawings.filter((d) => d.format.toUpperCase() === 'PDF').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drawing Library</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Store, preview, and analyze engineering drawings — synced to the cloud</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon"
            onClick={() => setViewMode('grid')}
          ><Grid3X3 size={16} /></Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'} size="icon"
            onClick={() => setViewMode('list')}
          ><List size={16} /></Button>
          <input ref={fileInputRef} type="file" multiple
            accept=".pdf,.dwg,.dxf,.dgn,.png,.jpg,.jpeg,.tif,.tiff,.bmp,.gif,.webp,.svg"
            className="hidden" onChange={handleFileChange} />
          <Button onClick={handleUploadClick} disabled={uploadingCount > 0}>
            {uploadingCount > 0 ? (
              <><Loader2 size={16} className="mr-1 animate-spin" /> Uploading {uploadingCount}...</>
            ) : (
              <><Upload size={16} className="mr-1" /> Upload Drawing</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {!isLoading && drawings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Drawings', value: totalDrawings, icon: FolderOpen, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950' },
            { label: 'Images', value: imageDrawings, icon: Image, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950' },
            { label: 'CAD Files', value: cadDrawings, icon: FileText, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950' },
            { label: 'PDFs', value: pdfDrawings, icon: FileText, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      {!isLoading && drawings.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Search drawings by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'All' ? <FolderOpen size={14} className="mr-1" /> : <Tag size={14} className="mr-1" />}
                {cat} {cat !== 'All' && `(${drawings.filter((d) => d.category === cat).length})`}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-24">
          <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[hsl(var(--muted-foreground))]">Loading drawings...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && drawings.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-[hsl(var(--border))] rounded-xl">
          <div className="inline-flex p-4 rounded-full bg-[hsl(var(--secondary))] mb-4">
            <CloudUpload size={40} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No drawings yet</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-6">
            Upload your engineering drawings, sketches, and CAD files. They're stored securely in the cloud, so they're available on any device you log in from.
          </p>
          <Button size="lg" onClick={handleUploadClick}>
            <Upload size={18} className="mr-2" /> Upload Your First Drawing
          </Button>
        </div>
      )}

      {/* No Results */}
      {!isLoading && drawings.length > 0 && filteredDrawings.length === 0 && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No drawings match your search</h3>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Try a different search term or filter</p>
        </div>
      )}

      {/* Drawing Grid View */}
      {!isLoading && filteredDrawings.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDrawings.map((d) => (
            <Card key={d.id} className="group overflow-hidden hover:shadow-lg transition-all duration-200 border-[hsl(var(--border))] hover:border-primary/30">
              <div className="cursor-pointer" onClick={() => setPreviewId(d.id)}>
                <div className={`aspect-[4/3] ${getCardBg(d.format)} flex items-center justify-center relative overflow-hidden`}>
                  {isImageType(d.format) ? (
                    <img src={d.url} alt={d.originalName} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    getFileIcon(d.format, 48)
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 dark:bg-gray-900/90 rounded-lg p-1.5 shadow-lg">
                      <Eye size={16} className="text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getTypeColor(d.format)}`}>
                      {d.format.toUpperCase()}
                    </span>
                  </div>
                  {d.category && d.category !== 'Other' && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-900/80 text-[hsl(var(--muted-foreground))]">
                        {d.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate flex-1" title={d.originalName}>{d.originalName}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {dateOf(d)}</span>
                  <span className="flex items-center gap-1"><HardDrive size={11} /> {formatFileSize(d.size)}</span>
                </div>
                {(d.rateItems && d.rateItems.length > 0) && (
                  <div className="mt-1.5 text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp size={11} /> Rate: {formatCurrency(getTotalRate(d))}
                  </div>
                )}

                {/* Category selector inline */}
                <div className="mt-2 flex items-center gap-1">
                  <select
                    value={d.category || 'Other'}
                    onChange={(e) => { e.stopPropagation(); updateCategory(d.id, e.target.value); }}
                    className="text-[10px] bg-[hsl(var(--secondary))] rounded px-1.5 py-0.5 border-0 outline-none cursor-pointer w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-1 mt-2 pt-2 border-t border-[hsl(var(--border))]">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleDownload(d); }}>
                    <FileDown size={12} className="mr-1" /> Download
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); toggleRateAnalysis(d.id); }}>
                    <TrendingUp size={12} className="mr-1" /> Rate
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500 ml-auto"
                    onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}>
                    <Trash2 size={12} />
                  </Button>
                </div>

                {/* Inline Rate Analysis */}
                {editingRateDrawings.has(d.id) && (
                  <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold flex items-center gap-1">
                          <TrendingUp size={11} /> Rate Analysis
                        </span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                          onClick={() => addRateItem(d)}>
                          <Plus size={12} />
                        </Button>
                      </div>
                      {(d.rateItems || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-1">
                          <input
                            placeholder="Item"
                            value={item.name}
                            onChange={(e) => updateRateItem(d, item.id, { name: e.target.value })}
                            className="flex-1 text-[10px] bg-[hsl(var(--secondary))] rounded px-1.5 py-0.5 border-0 outline-none min-w-0"
                          />
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => updateRateItem(d, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-12 text-[10px] bg-[hsl(var(--secondary))] rounded px-1 py-0.5 border-0 outline-none text-right"
                            placeholder="Qty"
                          />
                          <input
                            type="number"
                            value={item.rate || ''}
                            onChange={(e) => updateRateItem(d, item.id, { rate: parseFloat(e.target.value) || 0 })}
                            className="w-14 text-[10px] bg-[hsl(var(--secondary))] rounded px-1 py-0.5 border-0 outline-none text-right"
                            placeholder="Rate"
                          />
                          <span className="text-[10px] font-medium w-14 text-right">
                            {formatCurrency(item.quantity * item.rate)}
                          </span>
                          <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-red-400"
                            onClick={() => removeRateItem(d, item.id)}>
                            <X size={10} />
                          </Button>
                        </div>
                      ))}
                      {(d.rateItems || []).length > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-[hsl(var(--border))]">
                          <span className="text-[10px] font-semibold">Total</span>
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(getTotalRate(d))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Drawing List View */}
      {!isLoading && filteredDrawings.length > 0 && viewMode === 'list' && (
        <Card>
          <div className="divide-y divide-[hsl(var(--border))]">
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))/50]">
              <div className="col-span-5 flex items-center gap-2">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Actions</div>
            </div>
            {filteredDrawings.map((d) => (
              <div key={d.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-[hsl(var(--secondary))/30] transition-colors">
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-[hsl(var(--secondary))] flex items-center justify-center">
                    {isImageType(d.format) ? (
                      <img src={d.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      getFileIcon(d.format, 18)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                      onClick={() => setPreviewId(d.id)}>{d.originalName}</p>
                    {d.category && d.category !== 'Other' && (
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{d.category}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getTypeColor(d.format)}`}>
                    {d.format.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-1 text-sm text-[hsl(var(--muted-foreground))]">{formatFileSize(d.size)}</div>
                <div className="col-span-2 text-sm text-[hsl(var(--muted-foreground))]">{dateOf(d)}</div>
                <div className="col-span-2 flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(d)} title="Download">
                    <Download size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(d.id)} title="Delete">
                    <Trash2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 ${editingRateDrawings.has(d.id) ? 'text-green-500' : ''}`}
                    onClick={() => toggleRateAnalysis(d.id)} title="Rate Analysis">
                    <TrendingUp size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      {previewDrawing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewId(null)}>
          <div className="bg-[hsl(var(--card))] rounded-xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-[hsl(var(--border))] overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[hsl(var(--secondary))] shrink-0">
                  {getFileIcon(previewDrawing.format, 24)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">{previewDrawing.originalName}</h2>
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getTypeColor(previewDrawing.format)}`}>
                      {previewDrawing.format.toUpperCase()}
                    </span>
                    <span>{formatFileSize(previewDrawing.size)}</span>
                    <span>{dateOf(previewDrawing)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleDownload(previewDrawing)}>
                  <Download size={14} className="mr-1" /> Download
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setPreviewId(null)}>
                  <X size={20} />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-5 flex flex-col lg:flex-row gap-5 bg-[hsl(var(--secondary))/30]">
              {/* Preview */}
              <div className="flex-1 flex items-center justify-center min-h-[300px] bg-white dark:bg-gray-900 rounded-lg shadow-inner">
                {isImageType(previewDrawing.format) ? (
                  <img src={previewDrawing.url} alt={previewDrawing.originalName}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                ) : previewDrawing.format.toUpperCase() === 'PDF' ? (
                  <iframe src={previewDrawing.url} className="w-full h-[60vh] rounded-lg border-0" title={previewDrawing.originalName} />
                ) : (
                  <div className="text-center py-16">
                    <FileText size={64} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Preview not available</h3>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm max-w-md mb-4">
                      {['DWG', 'DXF', 'DGN'].includes(previewDrawing.format.toUpperCase())
                        ? 'CAD drawings cannot be previewed in the browser. Download to open in AutoCAD.'
                        : 'This file type cannot be previewed directly. Download to view.'}
                    </p>
                    <Button onClick={() => handleDownload(previewDrawing)}>
                      <Download size={14} className="mr-1" /> Download
                    </Button>
                  </div>
                )}
              </div>

              {/* Side Panel - Info & Rate Analysis */}
              <div className="lg:w-80 space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1">
                      <Tag size={14} /> Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Category</span>
                        <select value={previewDrawing.category || 'Other'}
                          onChange={(e) => updateCategory(previewDrawing.id, e.target.value)}
                          className="text-sm bg-[hsl(var(--secondary))] rounded px-2 py-0.5 border-0 outline-none">
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Type</span>
                        <span className="font-medium">{previewDrawing.format.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Size</span>
                        <span>{formatFileSize(previewDrawing.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Date</span>
                        <span>{dateOf(previewDrawing)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rate Analysis in Preview */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-1">
                        <TrendingUp size={14} /> Rate Analysis
                      </h3>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => addRateItem(previewDrawing)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {(previewDrawing.rateItems || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-1">
                          <input placeholder="Item" value={item.name}
                            onChange={(e) => updateRateItem(previewDrawing, item.id, { name: e.target.value })}
                            className="flex-1 text-xs bg-[hsl(var(--secondary))] rounded px-1.5 py-1 border-0 outline-none" />
                          <input type="number" value={item.quantity || ''}
                            onChange={(e) => updateRateItem(previewDrawing, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-14 text-xs bg-[hsl(var(--secondary))] rounded px-1 py-1 border-0 outline-none text-right" placeholder="Qty" />
                          <input type="number" value={item.rate || ''}
                            onChange={(e) => updateRateItem(previewDrawing, item.id, { rate: parseFloat(e.target.value) || 0 })}
                            className="w-16 text-xs bg-[hsl(var(--secondary))] rounded px-1 py-1 border-0 outline-none text-right" placeholder="Rate" />
                          <span className="text-xs font-medium w-16 text-right text-green-600 dark:text-green-400">
                            {formatCurrency(item.quantity * item.rate)}
                          </span>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400"
                            onClick={() => removeRateItem(previewDrawing, item.id)}>
                            <X size={10} />
                          </Button>
                        </div>
                      ))}
                      {(previewDrawing.rateItems || []).length > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
                          <span className="text-sm font-semibold">Total Cost</span>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(getTotalRate(previewDrawing))}
                          </span>
                        </div>
                      )}
                      {(previewDrawing.rateItems || []).length === 0 && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">
                          Add rate analysis items to estimate the cost of this drawing/work.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
