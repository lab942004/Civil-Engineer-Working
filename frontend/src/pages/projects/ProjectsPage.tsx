import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useList, useCreate, useUpdate, useDelete } from '@/hooks/useApi';
import { FolderKanban, Plus, MoreHorizontal, Search, Edit3, Trash2, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project } from '@/types';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  ON_HOLD: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', location: '', projectType: 'RESIDENTIAL', status: 'PLANNING', budget: 0, clientName: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: response, isLoading, refetch } = useList<Project>('/projects', ['projects'], { search: search || undefined });
  const createMutation = useCreate<Project>('/projects', ['projects'], 'Project created successfully');
  const updateMutation = useUpdate<Project>('/projects', ['projects'], 'Project updated successfully');
  const deleteMutation = useDelete('/projects', ['projects'], 'Project deleted successfully');
  const queryClient = useQueryClient();

  const projects = response?.data || [];

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', description: '', location: '', projectType: 'RESIDENTIAL', status: 'PLANNING', budget: 0, clientName: '' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch {}
  };

  const handleEdit = (project: Project) => {
    setForm({
      name: project.name,
      description: project.description || '',
      location: project.location || '',
      projectType: project.projectType,
      status: project.status,
      budget: project.budget || 0,
      clientName: project.clientName || '',
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch {}
  };

  const typeOptions = [
    { label: 'Residential', value: 'RESIDENTIAL' },
    { label: 'Commercial', value: 'COMMERCIAL' },
    { label: 'Road', value: 'ROAD' },
    { label: 'Bridge', value: 'BRIDGE' },
    { label: 'Drain', value: 'DRAIN' },
    { label: 'Canal', value: 'CANAL' },
    { label: 'Foundation', value: 'FOUNDATION' },
    { label: 'Wall', value: 'WALL' },
    { label: 'Roof', value: 'ROOF' },
    { label: 'Other', value: 'OTHER' },
  ];

  const statusOptions = [
    { label: 'Planning', value: 'PLANNING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-[hsl(var(--muted-foreground))]">{projects.length} total projects</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', description: '', location: '', projectType: 'RESIDENTIAL', status: 'PLANNING', budget: 0, clientName: '' }); }}>
          <Plus size={16} className="mr-1" /> {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">{editingId ? 'Edit Project' : 'Create New Project'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Project Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter project name" />
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Project description" />
              <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Project location" />
              <Select label="Type" options={typeOptions} value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} />
              <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
              <Input label="Budget (₹)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })} />
              <Input label="Client Name" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client name" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
                {editingId ? 'Update Project' : 'Create Project'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
        <Input placeholder="Search projects..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : projects.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]"><FolderKanban className="mx-auto h-12 w-12 mb-3 opacity-50" /><p>No projects yet. Create your first project.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-[hsl(221.2,83.2%,53.3%)]/10">
                        <FolderKanban size={20} className="text-[hsl(221.2,83.2%,53.3%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">{project.description || 'No description'}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                          <span>{project.projectType?.replace('_', ' ')}</span>
                          {project.location && <span>📍 {project.location}</span>}
                          {project.budget ? <span>₹{(project.budget / 10000000).toFixed(2)} Cr</span> : null}
                          {project.clientName && <span>👤 {project.clientName}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status] || ''}`}>{project.status?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(project)} title="Edit"><Edit3 size={14} /></Button>
                      {deleteConfirm === project.id ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)} className="text-red-500" title="Confirm delete"><Check size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(null)} title="Cancel"><X size={14} /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(project.id)} className="text-red-500" title="Delete"><Trash2 size={14} /></Button>
                      )}
                    </div>
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