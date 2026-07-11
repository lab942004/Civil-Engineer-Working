import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useList, useCreate, useUpdate, useDelete } from '@/hooks/useApi';
import { Receipt, Calculator, Plus, Trash2, Save, Download, TrendingUp, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface RateItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
}

interface RateTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  items: RateItem[];
  transportCost: number;
  taxPercent: number;
  overheadPercent: number;
  profitPercent: number;
}

const DEFAULT_UNITS = ['nos', 'kg', 'tonne', 'm³', 'm²', 'm', 'L', 'day', 'hour', 'bag'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function RateAnalysisPage() {
  const [templates, setTemplates] = useState<RateTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: response, isLoading, refetch } = useList<any>('/rate-analysis', ['rate-analysis'], { limit: 50 });
  const createMutation = useCreate<any>('/rate-analysis', ['rate-analysis'], 'Analysis saved');
  const updateMutation = useUpdate<any>('/rate-analysis', ['rate-analysis'], 'Analysis updated');
  const deleteMutation = useDelete('/rate-analysis', ['rate-analysis'], 'Analysis deleted');

  const savedTemplates = response?.data || [];

  const activeTemplate = templates.find((t) => t.id === activeTemplateId);

  // Initialize with default if no templates exist
  useEffect(() => {
    if (!isInitialized && savedTemplates.length > 0) {
      const mapped = savedTemplates.map((t: any) => ({
        id: t.id,
        name: t.name || 'Rate Analysis',
        description: t.description || '',
        createdAt: t.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        items: t.items || [],
        transportCost: t.transportCost || 0,
        taxPercent: t.taxPercent || 12,
        overheadPercent: t.overheadPercent || 5,
        profitPercent: t.profitPercent || 10,
      }));
      setTemplates(mapped);
      if (mapped.length > 0 && !activeTemplateId) {
        setActiveTemplateId(mapped[0].id);
      }
      setIsInitialized(true);
    } else if (!isInitialized && savedTemplates.length === 0 && !isLoading) {
      createNewTemplate();
      setIsInitialized(true);
    }
  }, [savedTemplates, isLoading]);

  const persistTemplates = useCallback((updated: RateTemplate[]) => {
    setTemplates(updated);
  }, []);

  const createNewTemplate = () => {
    const newTemplate: RateTemplate = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      name: `Rate Analysis #${templates.length + 1}`,
      description: '',
      createdAt: new Date().toISOString().split('T')[0],
      items: [
        { id: crypto.randomUUID?.() ?? '1', name: 'Cement (OPC 53 Grade)', unit: 'tonne', quantity: 0.35, rate: 6500 },
        { id: crypto.randomUUID?.() ?? '2', name: 'Sand', unit: 'm³', quantity: 0.45, rate: 1800 },
        { id: crypto.randomUUID?.() ?? '3', name: 'Coarse Aggregate (20mm)', unit: 'm³', quantity: 0.9, rate: 1500 },
        { id: crypto.randomUUID?.() ?? '4', name: 'Labour - Mason', unit: 'day', quantity: 2, rate: 800 },
        { id: crypto.randomUUID?.() ?? '5', name: 'Labour - Helper', unit: 'day', quantity: 4, rate: 600 },
      ],
      transportCost: 5000,
      taxPercent: 12,
      overheadPercent: 5,
      profitPercent: 10,
    };
    const updated = [...templates, newTemplate];
    persistTemplates(updated);
    setActiveTemplateId(newTemplate.id);
  };

  const updateTemplate = (updates: Partial<RateTemplate>) => {
    if (!activeTemplateId) return;
    const updated = templates.map((t) =>
      t.id === activeTemplateId ? { ...t, ...updates } : t
    );
    persistTemplates(updated);
  };

  const saveToBackend = async () => {
    if (!activeTemplate) return;
    try {
      const data = {
        name: activeTemplate.name,
        description: activeTemplate.description,
        items: activeTemplate.items,
        transportCost: activeTemplate.transportCost,
        taxPercent: activeTemplate.taxPercent,
        overheadPercent: activeTemplate.overheadPercent,
        profitPercent: activeTemplate.profitPercent,
      };
      if (savedTemplates.find((t: any) => t.id === activeTemplate.id)) {
        await updateMutation.mutateAsync({ id: activeTemplate.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      refetch();
    } catch {}
  };

  const deleteTemplate = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
    } catch {}
    const updated = templates.filter((t) => t.id !== id);
    persistTemplates(updated);
    if (activeTemplateId === id) {
      setActiveTemplateId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const duplicateTemplate = (id: string) => {
    const source = templates.find((t) => t.id === id);
    if (!source) return;
    const copy: RateTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    persistTemplates([...templates, copy]);
  };

  const addItem = () => {
    if (!activeTemplateId) return;
    const template = templates.find((t) => t.id === activeTemplateId);
    if (!template) return;
    const newItem: RateItem = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      name: '', unit: 'nos', quantity: 1, rate: 0,
    };
    updateTemplate({ items: [...template.items, newItem] });
  };

  const updateItem = (itemId: string, updates: Partial<RateItem>) => {
    if (!activeTemplateId) return;
    const template = templates.find((t) => t.id === activeTemplateId);
    if (!template) return;
    const items = template.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateTemplate({ items });
  };

  const removeItem = (itemId: string) => {
    if (!activeTemplateId) return;
    const template = templates.find((t) => t.id === activeTemplateId);
    if (!template) return;
    updateTemplate({ items: template.items.filter((item) => item.id !== itemId) });
  };

  // Calculations
  const materialCost = activeTemplate?.items.reduce((s, i) => s + i.quantity * i.rate, 0) ?? 0;
  const totalTransport = activeTemplate?.transportCost ?? 0;
  const overhead = (materialCost + totalTransport) * (activeTemplate?.overheadPercent ?? 0) / 100;
  const taxes = (materialCost + totalTransport + overhead) * (activeTemplate?.taxPercent ?? 0) / 100;
  const subtotal = materialCost + totalTransport + overhead + taxes;
  const profit = subtotal * (activeTemplate?.profitPercent ?? 0) / 100;
  const totalCost = subtotal + profit;

  const exportCSV = () => {
    if (!activeTemplate) return;
    const headers = 'Item,Unit,Quantity,Rate,Amount\n';
    const rows = activeTemplate.items.map((i) =>
      `"${i.name}",${i.unit},${i.quantity},${i.rate},${i.quantity * i.rate}`
    ).join('\n');
    const summary = `\n\nMaterial Cost,${formatCurrency(materialCost)}\nTransport,${formatCurrency(totalTransport)}\nOverhead (${activeTemplate.overheadPercent}%),${formatCurrency(overhead)}\nTax (${activeTemplate.taxPercent}%),${formatCurrency(taxes)}\nProfit (${activeTemplate.profitPercent}%),${formatCurrency(profit)}\nTotal,${formatCurrency(totalCost)}`;
    const blob = new Blob(['\uFEFF' + headers + rows + summary], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeTemplate.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rate Analysis</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Create, save and manage rate analysis templates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showSaved ? 'default' : 'outline'} size="sm" onClick={() => setShowSaved(!showSaved)}>
            <TrendingUp size={14} className="mr-1" /> Saved ({templates.length})
          </Button>
          <Button onClick={createNewTemplate}><Plus size={16} className="mr-1" /> New Analysis</Button>
        </div>
      </div>

      {showSaved && (
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input placeholder="Search saved analyses..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredTemplates.map((t) => (
                <div key={t.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeTemplateId === t.id ? 'border-primary bg-primary/5' : 'border-[hsl(var(--border))] hover:border-primary/30'
                  }`}
                  onClick={() => { setActiveTemplateId(t.id); setShowSaved(false); }}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.items.length} items &middot; {t.createdAt}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={(e) => { e.stopPropagation(); duplicateTemplate(t.id); }}>
                        <Plus size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500"
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredTemplates.length === 0 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] col-span-full text-center py-4">No saved analyses found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <input value={activeTemplate.name}
                    onChange={(e) => updateTemplate({ name: e.target.value })}
                    className="text-lg font-semibold bg-transparent border-0 outline-none w-full focus:ring-0 p-0" placeholder="Analysis Name" />
                  <input value={activeTemplate.description}
                    onChange={(e) => updateTemplate({ description: e.target.value })}
                    className="text-sm text-[hsl(var(--muted-foreground))] bg-transparent border-0 outline-none w-full focus:ring-0 p-0 mt-0.5" placeholder="Add description (optional)" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download size={14} className="mr-1" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveToBackend} disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin mr-1" size={14} /> : <Save size={14} className="mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-2 px-2 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))/50] rounded-t-lg">
                <div className="col-span-4">Item Name</div>
                <div className="col-span-1 text-center">Unit</div>
                <div className="col-span-2 text-right">Quantity</div>
                <div className="col-span-2 text-right">Rate (₹)</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>
              <div className="space-y-1 mt-1">
                {activeTemplate.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 px-2 py-1.5 items-center rounded hover:bg-[hsl(var(--secondary))/30] transition-colors group">
                    <div className="col-span-4">
                      <input placeholder="Item name" value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        className="w-full text-sm bg-transparent border-0 outline-none focus:ring-0 p-0" />
                    </div>
                    <div className="col-span-1">
                      <select value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                        className="w-full text-xs bg-[hsl(var(--secondary))] rounded px-1 py-0.5 border-0 outline-none text-center">
                        {DEFAULT_UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} className="h-7 text-xs text-right" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={item.rate || ''}
                        onChange={(e) => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })} className="h-7 text-xs text-right" />
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium">{formatCurrency(item.quantity * item.rate)}</div>
                    <div className="col-span-1 text-center">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 transition-opacity"
                        onClick={() => removeItem(item.id)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={addItem}>
                  <Plus size={12} className="mr-1" /> Add Item
                </Button>
              </div>
              <div className="mt-6 space-y-2 pt-4 border-t border-[hsl(var(--border))]">
                <h4 className="text-sm font-semibold mb-2">Additional Costs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))] flex-1">Transportation</span>
                    <Input type="number" value={activeTemplate.transportCost || ''}
                      onChange={(e) => updateTemplate({ transportCost: parseFloat(e.target.value) || 0 })} className="w-28 h-7 text-xs text-right" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))] flex-1">Overhead (%)</span>
                    <Input type="number" value={activeTemplate.overheadPercent || ''}
                      onChange={(e) => updateTemplate({ overheadPercent: parseFloat(e.target.value) || 0 })} className="w-20 h-7 text-xs text-right" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))] flex-1">Tax (%)</span>
                    <Input type="number" value={activeTemplate.taxPercent || ''}
                      onChange={(e) => updateTemplate({ taxPercent: parseFloat(e.target.value) || 0 })} className="w-20 h-7 text-xs text-right" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))] flex-1">Profit (%)</span>
                    <Input type="number" value={activeTemplate.profitPercent || ''}
                      onChange={(e) => updateTemplate({ profitPercent: parseFloat(e.target.value) || 0 })} className="w-20 h-7 text-xs text-right" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Calculator size={16} /> Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Material Cost</span>
                  <span className="font-medium">{formatCurrency(materialCost)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Transportation</span>
                  <span className="font-medium">{formatCurrency(totalTransport)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Overhead ({activeTemplate.overheadPercent}%)</span>
                  <span className="font-medium">{formatCurrency(overhead)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Tax ({activeTemplate.taxPercent}%)</span>
                  <span className="font-medium">{formatCurrency(taxes)}</span>
                </div>
                <hr className="border-[hsl(var(--border))]" />
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Profit ({activeTemplate.profitPercent}%)</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(profit)}</span>
                </div>
                <hr className="border-[hsl(var(--border))]" />
                <div className="flex justify-between text-base py-1">
                  <span className="font-bold">Total Cost</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCost)}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-[hsl(var(--border))]">
                <h4 className="text-xs font-semibold mb-2 text-[hsl(var(--muted-foreground))]">COST DISTRIBUTION</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Materials', value: materialCost, color: 'bg-blue-500' },
                    { label: 'Transport', value: totalTransport, color: 'bg-green-500' },
                    { label: 'Overhead', value: overhead, color: 'bg-yellow-500' },
                    { label: 'Tax', value: taxes, color: 'bg-red-500' },
                    { label: 'Profit', value: profit, color: 'bg-purple-500' },
                  ].map((item) => {
                    const pct = totalCost > 0 ? (item.value / totalCost) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-[10px]">
                          <span>{item.label}</span>
                          <span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${item.color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button className="w-full" onClick={exportCSV}>
                <Download size={14} className="mr-1" /> Export to CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!activeTemplate && (
        <div className="text-center py-24 border-2 border-dashed border-[hsl(var(--border))] rounded-xl">
          <Calculator size={48} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No rate analysis selected</h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">Create a new analysis or select a saved one</p>
          <Button size="lg" onClick={createNewTemplate}>
            <Plus size={18} className="mr-2" /> Create New Analysis
          </Button>
        </div>
      )}
    </div>
  );
}