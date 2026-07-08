import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useList, useCreate, useUpdate, useDelete } from '@/hooks/useApi';
import { FileText, Plus, Search, Trash2, FileDown, Loader2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Report } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'CALCULATION' | 'INSPECTION' | 'PROJECT' | 'MATERIAL' | 'DAILY_PROGRESS'>('CALCULATION');
  const [content, setContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: response, isLoading, refetch } = useList<Report>('/reports', ['reports'], { search: search || undefined });
  const createMutation = useCreate<Report>('/reports', ['reports'], 'Report created');
  const deleteMutation = useDelete('/reports', ['reports'], 'Report deleted');

  const reports = response?.data || [];

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    try {
      await createMutation.mutateAsync({ title, type, content, status: 'DRAFT' });
      setShowForm(false); setTitle(''); setContent('');
      refetch();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); setDeleteConfirm(null); refetch(); } catch {}
  };

  const handleExportPdf = async (report: Report) => {
    try {
      if (report.pdfUrl) {
        window.open(report.pdfUrl, '_blank');
      } else {
        // Generate a simple text-based report download
        const blob = new Blob([`${report.title}\n\n${report.content || ''}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${report.title}.txt`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Report downloaded');
      }
    } catch { toast.error('Export failed'); }
  };

  const typeOptions = [
    { label: 'Calculation', value: 'CALCULATION' },
    { label: 'Inspection', value: 'INSPECTION' },
    { label: 'Project', value: 'PROJECT' },
    { label: 'Material', value: 'MATERIAL' },
    { label: 'Daily Progress', value: 'DAILY_PROGRESS' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-[hsl(var(--muted-foreground))]">{reports.length} reports</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus size={16} className="mr-1" /> {showForm ? 'Cancel' : 'New Report'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Create Report</h3>
            <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title" />
            <Select label="Type" options={typeOptions} value={type} onChange={(e) => setType(e.target.value as any)} />
            <div className="space-y-1">
              <label className="text-sm font-medium">Content</label>
              <textarea className="w-full min-h-[150px] rounded-lg border border-[hsl(var(--input))] bg-transparent p-3 text-sm" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Report content..." />
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="animate-spin mr-1" size={16} /> : null} Generate Report
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
        <Input placeholder="Search reports..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> : reports.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]"><FileText className="mx-auto h-12 w-12 mb-3 opacity-50" /><p>No reports generated yet.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(221.2,83.2%,53.3%)]/10"><FileText size={20} className="text-[hsl(221.2,83.2%,53.3%)]" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{report.title}</h3>
                    <div className="flex gap-2 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      <span>{report.type?.replace('_', ' ')}</span>
                      <span>{report.createdAt ? formatDate(report.createdAt) : ''}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${report.status === 'GENERATED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{report.status}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleExportPdf(report)} title="Download"><FileDown size={14} /></Button>
                        {deleteConfirm === report.id ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(report.id)} className="text-red-500"><Check size={14} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(null)}><X size={14} /></Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(report.id)} className="text-red-500"><Trash2 size={14} /></Button>
                        )}
                      </div>
                    </div>
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