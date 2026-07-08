import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useList, useCreate, useUpdate, useDelete } from '@/hooks/useApi';
import { FileSpreadsheet, Plus, Trash2, Download, Printer, Search, Save, ChevronDown, ChevronUp, FolderOpen, TrendingUp, DollarSign, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BOQ, BOQItem } from '@/types';
import EngineeringDisclaimer from '@/components/shared/EngineeringDisclaimer';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const UNITS = ['m³', 'm²', 'm', 'kg', 'tonne', 'nos', 'L', 'day', 'hour', 'sq.ft', 'sq.m', 'bag'];

const SECTIONS = [
  'Earthwork', 'Concrete', 'Reinforcement', 'Formwork', 'Brickwork',
  'Plaster', 'Flooring', 'Waterproofing', 'Painting', 'Joinery', 'MEP', 'External Works', 'Other',
];

const SECTION_COLORS: Record<string, string> = {
  Earthwork: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Concrete: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
  Reinforcement: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  Formwork: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  Brickwork: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  Plaster: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  Flooring: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Waterproofing: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  Painting: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  Joinery: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  MEP: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  'External Works': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
};

const PRESET_ITEMS: Record<string, Omit<BOQItem, 'id' | 'itemNo'>[]> = {
  Earthwork: [
    { description: 'Earthwork in excavation in foundation trenches', unit: 'm³', quantity: 150, rate: 325, amount: 0 },
    { description: 'Earth filling in plinth', unit: 'm³', quantity: 80, rate: 280, amount: 0 },
    { description: 'Sand filling in foundation', unit: 'm³', quantity: 40, rate: 450, amount: 0 },
  ],
  Concrete: [
    { description: 'PCC (1:4:8) in foundation', unit: 'm³', quantity: 25, rate: 4200, amount: 0 },
    { description: 'RCC (M25) in footing', unit: 'm³', quantity: 35, rate: 5800, amount: 0 },
    { description: 'RCC (M20) in column & beam', unit: 'm³', quantity: 45, rate: 5500, amount: 0 },
    { description: 'RCC (M20) in slab', unit: 'm³', quantity: 30, rate: 5200, amount: 0 },
  ],
  Reinforcement: [
    { description: 'HYSD steel reinforcement (Fe500)', unit: 'tonne', quantity: 12, rate: 72000, amount: 0 },
    { description: 'Mild steel reinforcement', unit: 'tonne', quantity: 3, rate: 68000, amount: 0 },
    { description: 'Binding wire', unit: 'kg', quantity: 250, rate: 85, amount: 0 },
  ],
  Brickwork: [
    { description: 'Brickwork in CM (1:6)', unit: 'm³', quantity: 80, rate: 3500, amount: 0 },
    { description: 'Brickwork in CM (1:4)', unit: 'm³', quantity: 20, rate: 3800, amount: 0 },
  ],
  Plaster: [
    { description: 'Internal plaster (1:4) 12mm', unit: 'sq.m', quantity: 450, rate: 280, amount: 0 },
    { description: 'External plaster (1:4) 15mm', unit: 'sq.m', quantity: 200, rate: 320, amount: 0 },
  ],
  Flooring: [
    { description: 'Vitrified tile flooring', unit: 'sq.m', quantity: 200, rate: 850, amount: 0 },
    { description: 'Kota stone flooring', unit: 'sq.m', quantity: 100, rate: 650, amount: 0 },
    { description: 'Skirting', unit: 'm', quantity: 250, rate: 180, amount: 0 },
  ],
  Painting: [
    { description: 'Interior painting (2 coats)', unit: 'sq.m', quantity: 500, rate: 120, amount: 0 },
    { description: 'Exterior painting (2 coats)', unit: 'sq.m', quantity: 200, rate: 150, amount: 0 },
  ],
};

export default function BOQPage() {
  const [items, setItems] = useState<BOQItem[]>([]);
  const [projectName, setProjectName] = useState('New Construction Project');
  const [location, setLocation] = useState('');
  const [client, setClient] = useState('');
  const [expandSections, setExpandSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [transportCost, setTransportCost] = useState(25000);
  const [gstPercent, setGstPercent] = useState(12);
  const [overheadPercent, setOverheadPercent] = useState(5);
  const [contingencyPercent, setContingencyPercent] = useState(3);
  const [showSummary, setShowSummary] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: response, isLoading, refetch } = useList<BOQ>('/boq', ['boq'], { limit: 50 });
  const createMutation = useCreate<BOQ>('/boq', ['boq'], 'BOQ saved successfully');
  const updateMutation = useUpdate<BOQ>('/boq', ['boq'], 'BOQ updated successfully');
  const deleteMutation = useDelete('/boq', ['boq'], 'BOQ deleted successfully');
  const queryClient = useQueryClient();

  const savedBOQs = response?.data || [];

  // BUG FIX: this used to run unconditionally on mount and silently filled
  // every brand-new BOQ with ~20 fake "sample project" line items (real
  // numbers like "Earthwork... 150 m³ @ ₹325"). If you didn't notice and
  // hit Save, that fake dataset became your saved BOQ. A new BOQ now starts
  // genuinely empty; sample data is only loaded if you explicitly ask for
  // it via the "Load Sample Project" button in the empty state below.
  const loadSampleProject = () => {
    const newItems: BOQItem[] = [];
    let itemNo = 1;
    Object.values(PRESET_ITEMS).flat().forEach((preset) => {
      newItems.push({
        ...preset,
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        itemNo: itemNo++,
        amount: preset.quantity * preset.rate,
      });
    });
    setItems(newItems);
    setExpandSections({ Earthwork: true });
    toast.success('Sample project loaded — edit or replace these items with your real quantities');
  };

  const addItem = (section: string) => {
    const newItem: BOQItem = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      itemNo: items.length + 1,
      description: '',
      unit: 'nos',
      quantity: 0,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
    setExpandSections((prev) => ({ ...prev, [section]: true }));
  };

  const updateItem = (id: string, field: keyof BOQItem, value: string | number) => {
    setItems(items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const addPresetItems = (section: string) => {
    const presets = PRESET_ITEMS[section];
    if (!presets) return;
    let itemNo = items.length + 1;
    const newItems = presets.map((p) => ({
      ...p,
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      itemNo: itemNo++,
      amount: p.quantity * p.rate,
    }));
    setItems([...items, ...newItems]);
    setExpandSections((prev) => ({ ...prev, [section]: true }));
  };

  const saveBOQ = async () => {
    try {
      const boqData = {
        title: projectName,
        description: `Location: ${location}, Client: ${client}`,
        items: items.map((item) => ({
          itemNo: item.itemNo,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        totalCost: grandTotal,
        status: 'DRAFT' as const,
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: boqData });
      } else {
        await createMutation.mutateAsync(boqData);
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch {}
  };

  const loadBOQ = (boq: BOQ) => {
    setProjectName(boq.title);
    setItems(boq.items || []);
    setEditingId(boq.id);
    setShowSaved(false);
    if (boq.description) {
      const parts = boq.description.split(', ');
      parts.forEach((p) => {
        if (p.startsWith('Location: ')) setLocation(p.replace('Location: ', ''));
        if (p.startsWith('Client: ')) setClient(p.replace('Client: ', ''));
      });
    }
  };

  const deleteSaved = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
    } catch {}
  };

  const exportCSV = () => {
    const lines: string[] = [];
    lines.push('BILL OF QUANTITIES');
    lines.push('Project,' + projectName);
    lines.push('Location,' + location);
    lines.push('Client,' + client);
    lines.push('Date,' + new Date().toLocaleDateString());
    lines.push('');
    lines.push('Item No,Description,Unit,Quantity,Rate,Amount');
    
    items.forEach((item) => {
      lines.push(`${item.itemNo},"${item.description}",${item.unit},${item.quantity},${item.rate},${item.amount}`);
    });
    
    lines.push('');
    lines.push('SUMMARY');
    lines.push(`Total Items Cost,${totalItemsCost}`);
    lines.push(`Transport,${transportCost}`);
    lines.push(`GST (${gstPercent}%),${gstAmount}`);
    lines.push(`Overhead (${overheadPercent}%),${overheadAmount}`);
    lines.push(`Contingency (${contingencyPercent}%),${contingencyAmount}`);
    lines.push(`Grand Total,${grandTotal}`);

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `BOQ_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculations
  const totalItemsCost = items.reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = totalItemsCost * gstPercent / 100;
  const overheadAmount = totalItemsCost * overheadPercent / 100;
  const contingencyAmount = totalItemsCost * contingencyPercent / 100;
  const grandTotal = totalItemsCost + transportCost + gstAmount + overheadAmount + contingencyAmount;

  // Group items by section (using a default section since BOQItem doesn't have section)
  const sectionOrder = ['Items'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BOQ Generator</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Comprehensive Bill of Quantities with section-wise breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showSaved ? 'default' : 'outline'} size="sm" onClick={() => setShowSaved(!showSaved)}>
            <Save size={14} className="mr-1" /> Saved ({savedBOQs.length})
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
          <Button onClick={saveBOQ} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin mr-1" size={16} /> : <FileSpreadsheet size={16} className="mr-1" />}
            {editingId ? 'Update BOQ' : 'Save BOQ'}
          </Button>
        </div>
      </div>

      <EngineeringDisclaimer compact />


      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: items.length, icon: FileText, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950' },
          { label: 'Item Cost', value: formatCurrency(totalItemsCost), icon: DollarSign, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950' },
          { label: 'Grand Total', value: formatCurrency(grandTotal), icon: TrendingUp, color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950' },
          { label: 'Saved', value: savedBOQs.length, icon: Save, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${stat.color} shrink-0`}>
                <stat.icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold truncate">{stat.value}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Saved BOQs Panel */}
      {showSaved && (
        <Card className="border-primary/30">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6" /></div>
            ) : savedBOQs.length === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">No saved BOQs yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {savedBOQs.map((boq) => (
                  <div key={boq.id}
                    className="p-3 rounded-lg border border-[hsl(var(--border))] hover:border-primary/30 cursor-pointer transition-colors"
                    onClick={() => loadBOQ(boq)}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{boq.title}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {boq.items?.length || 0} items &middot; {formatCurrency(boq.totalCost)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 shrink-0 ml-2"
                        onClick={(e) => { e.stopPropagation(); deleteSaved(boq.id); }}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet size={18} /> Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Project Name</label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)}
                className="h-8 text-sm" placeholder="Enter project name" />
            </div>
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)}
                className="h-8 text-sm" placeholder="Project location" />
            </div>
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Client</label>
              <Input value={client} onChange={(e) => setClient(e.target.value)}
                className="h-8 text-sm" placeholder="Client name" />
            </div>
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Date</label>
              <Input value={new Date().toLocaleDateString('en-IN')} disabled className="h-8 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Filter */}
      {items.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* BOQ Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-[hsl(var(--border))] bg-[hsl(var(--secondary))/30]">
                  <th className="text-left px-3 py-1.5 w-10">#</th>
                  <th className="text-left px-3 py-1.5">Description</th>
                  <th className="text-left px-3 py-1.5 w-16">Unit</th>
                  <th className="text-right px-3 py-1.5 w-20">Quantity</th>
                  <th className="text-right px-3 py-1.5 w-24">Rate (₹)</th>
                  <th className="text-right px-3 py-1.5 w-24">Amount (₹)</th>
                  <th className="w-10 px-3 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center">
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                        This BOQ is empty. Add your own line items, or load a sample
                        project to see the format (remember to replace the numbers
                        with your real quantities before saving).
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" onClick={() => addItem('Items')}>
                          <Plus size={14} className="mr-1" /> Add Item
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadSampleProject}>
                          <FolderOpen size={14} className="mr-1" /> Load Sample Project
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : items.filter((item) =>
                  !searchQuery || item.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((item) => (
                  <tr key={item.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))/20] transition-colors group">
                    <td className="px-3 py-1 text-center text-[hsl(var(--muted-foreground))]">{item.itemNo}</td>
                    <td className="px-3 py-1">
                      <input value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-xs" placeholder="Description" />
                    </td>
                    <td className="px-3 py-1">
                      <select value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full text-[10px] bg-[hsl(var(--secondary))] rounded px-1 py-0.5 border-0 outline-none">
                        {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
                      </select>
                    </td>
                    <td className="px-3 py-1">
                      <input type="number" value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-0 outline-none focus:ring-0 p-0 text-xs" placeholder="0" />
                    </td>
                    <td className="px-3 py-1">
                      <input type="number" value={item.rate || ''}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-0 outline-none focus:ring-0 p-0 text-xs" placeholder="0" />
                    </td>
                    <td className="px-3 py-1 text-right font-medium text-xs">{formatCurrency(item.amount)}</td>
                    <td className="px-3 py-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 transition-opacity"
                        onClick={() => deleteItem(item.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-[hsl(var(--border))]">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addItem('Items')}>
              <Plus size={12} className="mr-1" /> Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Summary Bar */}
      <Card>
        <CardHeader className="py-3 cursor-pointer" onClick={() => setShowSummary(!showSummary)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign size={18} /> Financial Summary
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Grand Total:</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(grandTotal)}</span>
              {showSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </CardHeader>
        {showSummary && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Additional Costs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Transportation</label>
                    <Input type="number" value={transportCost || ''}
                      onChange={(e) => setTransportCost(parseFloat(e.target.value) || 0)} className="h-8 text-sm text-right" />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">GST (%)</label>
                    <Input type="number" value={gstPercent || ''}
                      onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)} className="h-8 text-sm text-right" />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Overhead (%)</label>
                    <Input type="number" value={overheadPercent || ''}
                      onChange={(e) => setOverheadPercent(parseFloat(e.target.value) || 0)} className="h-8 text-sm text-right" />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Contingency (%)</label>
                    <Input type="number" value={contingencyPercent || ''}
                      onChange={(e) => setContingencyPercent(parseFloat(e.target.value) || 0)} className="h-8 text-sm text-right" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Cost Breakdown</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Items Total', value: totalItemsCost, color: 'bg-blue-500' },
                    { label: 'Transportation', value: transportCost, color: 'bg-green-500' },
                    { label: `GST (${gstPercent}%)`, value: gstAmount, color: 'bg-red-500' },
                    { label: `Overhead (${overheadPercent}%)`, value: overheadAmount, color: 'bg-yellow-500' },
                    { label: `Contingency (${contingencyPercent}%)`, value: contingencyAmount, color: 'bg-purple-500' },
                  ].map((item) => {
                    const pct = grandTotal > 0 ? (item.value / grandTotal) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[hsl(var(--muted-foreground))]">{item.label}</span>
                          <span className="font-medium">{formatCurrency(item.value)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <hr className="border-[hsl(var(--border))]" />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Grand Total</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-[hsl(var(--border))] rounded-xl">
          <FileSpreadsheet size={48} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No BOQ items yet</h3>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">Add items to create your Bill of Quantities</p>
          <Button onClick={() => addItem('Items')}><Plus size={16} className="mr-1" /> Add First Item</Button>
        </div>
      )}
    </div>
  );
}