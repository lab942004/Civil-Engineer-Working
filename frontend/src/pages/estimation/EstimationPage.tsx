import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useList, useCreate, useUpdate, useDelete } from '@/hooks/useApi';
import { Building2, Calculator, Download, Plus, Trash2, Save, Search, Home, Warehouse, Building, Road, GitBranch, TrendingUp, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Estimation } from '@/types';
import EngineeringDisclaimer from '@/components/shared/EngineeringDisclaimer';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

interface EstimationItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  category: string;
}

const BUILDING_TYPES = [
  { value: 'RESIDENTIAL', label: 'Residential', icon: Home, minRate: 1500, maxRate: 2500 },
  { value: 'COMMERCIAL', label: 'Commercial', icon: Building, minRate: 2000, maxRate: 3500 },
  { value: 'INDUSTRIAL', label: 'Industrial', icon: Warehouse, minRate: 1800, maxRate: 3000 },
  { value: 'ROAD', label: 'Road (per sq.m)', icon: Road, minRate: 5000, maxRate: 12000 },
  { value: 'BRIDGE', label: 'Bridge (per sq.m)', icon: GitBranch, minRate: 15000, maxRate: 35000 },
];

const DEFAULT_UNITS = ['sq.ft', 'sq.m', 'nos', 'kg', 'tonne', 'm³', 'm²', 'm', 'L', 'day', 'hour', 'bag'];
const CATEGORIES = ['Structure', 'Architecture', 'MEP', 'Finishing', 'Foundation', 'Superstructure', 'Other'];

const PRESET_ITEMS: Record<string, EstimationItem[]> = {
  RESIDENTIAL: [
    { id: 'p1', name: 'Earthwork in Excavation', unit: 'm³', quantity: 150, rate: 350, category: 'Foundation' },
    { id: 'p2', name: 'PCC (1:4:8) in Foundation', unit: 'm³', quantity: 25, rate: 4200, category: 'Foundation' },
    { id: 'p3', name: 'RCC (M25) in Footing', unit: 'm³', quantity: 35, rate: 5800, category: 'Structure' },
    { id: 'p4', name: 'RCC (M20) in Column & Beam', unit: 'm³', quantity: 45, rate: 5500, category: 'Structure' },
    { id: 'p5', name: 'RCC (M20) in Slab', unit: 'm³', quantity: 30, rate: 5200, category: 'Structure' },
    { id: 'p6', name: 'Brickwork (1:6)', unit: 'm³', quantity: 80, rate: 3500, category: 'Superstructure' },
    { id: 'p7', name: 'Plaster (1:4) 12mm', unit: 'sq.m', quantity: 450, rate: 280, category: 'Finishing' },
    { id: 'p8', name: 'Flooring - Vitrified Tiles', unit: 'sq.m', quantity: 200, rate: 850, category: 'Finishing' },
    { id: 'p9', name: 'Painting - Interior', unit: 'sq.m', quantity: 500, rate: 120, category: 'Finishing' },
    { id: 'p10', name: 'Electrical Wiring', unit: 'sq.m', quantity: 250, rate: 450, category: 'MEP' },
  ],
  COMMERCIAL: [
    { id: 'c1', name: 'Earthwork in Excavation', unit: 'm³', quantity: 300, rate: 380, category: 'Foundation' },
    { id: 'c2', name: 'PCC in Foundation', unit: 'm³', quantity: 50, rate: 4500, category: 'Foundation' },
    { id: 'c3', name: 'RCC (M30) in Footing', unit: 'm³', quantity: 80, rate: 6200, category: 'Structure' },
    { id: 'c4', name: 'RCC (M25) in Column & Beam', unit: 'm³', quantity: 100, rate: 5800, category: 'Structure' },
    { id: 'c5', name: 'RCC (M25) in Slab', unit: 'm³', quantity: 70, rate: 5500, category: 'Structure' },
    { id: 'c6', name: 'Brickwork (1:6)', unit: 'm³', quantity: 150, rate: 3800, category: 'Superstructure' },
    { id: 'c7', name: 'Plaster (1:4) 15mm', unit: 'sq.m', quantity: 800, rate: 300, category: 'Finishing' },
    { id: 'c8', name: 'Flooring - Granite', unit: 'sq.m', quantity: 400, rate: 1200, category: 'Finishing' },
    { id: 'c9', name: 'False Ceiling', unit: 'sq.m', quantity: 350, rate: 650, category: 'Finishing' },
    { id: 'c10', name: 'HVAC System', unit: 'sq.m', quantity: 500, rate: 1500, category: 'MEP' },
  ],
  INDUSTRIAL: [
    { id: 'i1', name: 'Earthwork', unit: 'm³', quantity: 500, rate: 320, category: 'Foundation' },
    { id: 'i2', name: 'PCC in Foundation', unit: 'm³', quantity: 60, rate: 4000, category: 'Foundation' },
    { id: 'i3', name: 'RCC (M35) in Column', unit: 'm³', quantity: 120, rate: 6500, category: 'Structure' },
    { id: 'i4', name: 'Steel Structure - Truss', unit: 'tonne', quantity: 25, rate: 85000, category: 'Structure' },
    { id: 'i5', name: 'Roof Sheeting', unit: 'sq.m', quantity: 800, rate: 750, category: 'Superstructure' },
    { id: 'i6', name: 'Floor Hardener', unit: 'sq.m', quantity: 600, rate: 500, category: 'Finishing' },
    { id: 'i7', name: 'Electrical - HT/LT', unit: 'sq.m', quantity: 500, rate: 1200, category: 'MEP' },
    { id: 'i8', name: 'Fire Fighting System', unit: 'sq.m', quantity: 500, rate: 800, category: 'MEP' },
  ],
};

export default function EstimationPage() {
  const [type, setType] = useState('RESIDENTIAL');
  const [area, setArea] = useState(1000);
  const [floors, setFloors] = useState(1);
  const [items, setItems] = useState<EstimationItem[]>([]);
  const [showItems, setShowItems] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [estimationName, setEstimationName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: response, isLoading, refetch } = useList<Estimation>('/estimations', ['estimations'], { limit: 50 });
  const createMutation = useCreate<Estimation>('/estimations', ['estimations'], 'Estimation saved');
  const updateMutation = useUpdate<Estimation>('/estimations', ['estimations'], 'Estimation updated');
  const deleteMutation = useDelete('/estimations', ['estimations'], 'Estimation deleted');

  const savedEstimations = response?.data || [];

  const currentType = BUILDING_TYPES.find((t) => t.value === type)!;
  const costPerSqft = (currentType.minRate + currentType.maxRate) / 2;

  useEffect(() => {
    const preset = PRESET_ITEMS[type] || PRESET_ITEMS.RESIDENTIAL;
    setItems(preset.map((item) => ({
      ...item,
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    })));
    setEstimationName(`${currentType.label} Building - ${area} sq.ft`);
  }, [type]);

  useEffect(() => {
    setEstimationName(`${currentType.label} Building - ${area} sq.ft`);
  }, [area, type]);

  const totalBaseCost = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const floorFactor = 1 + (floors - 1) * 0.15;
  const areaMultiplier = area / 1000;
  const totalCost = totalBaseCost * floorFactor * areaMultiplier;

  const categoryTotals = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity * item.rate;
    return acc;
  }, {});

  const addItem = () => {
    const newItem: EstimationItem = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: '', unit: 'nos', quantity: 1, rate: 0, category: 'Other',
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<EstimationItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const saveEstimation = async () => {
    try {
      const data = {
        title: estimationName,
        buildingType: type,
        area,
        costPerSqft,
        totalCost,
        breakdown: Object.entries(categoryTotals).map(([category, amount]) => ({
          category,
          percentage: totalBaseCost > 0 ? (amount / totalBaseCost) * 100 : 0,
          amount,
          items: items.filter((i) => i.category === category).map((i) => ({ name: i.name, cost: i.quantity * i.rate })),
        })),
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      refetch();
    } catch {}
  };

  const loadSavedEstimation = (est: Estimation) => {
    setType(est.buildingType);
    setArea(est.area);
    setEditingId(est.id);
    setEstimationName(est.title);
    setShowSaved(false);
  };

  const deleteSaved = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); refetch(); } catch {}
  };

  const exportReport = () => {
    const lines: string[] = [];
    lines.push('ESTIMATION REPORT');
    lines.push('='.repeat(50));
    lines.push(`Project: ${estimationName}`);
    lines.push(`Building Type: ${currentType.label}`);
    lines.push(`Built-up Area: ${area} sq.ft`);
    lines.push(`Floors: ${floors}`);
    lines.push(`Date: ${new Date().toISOString().split('T')[0]}`);
    lines.push('');
    lines.push('ITEMS');
    lines.push('-'.repeat(80));
    lines.push('Item,Category,Unit,Qty,Rate,Amount');
    items.forEach((item) => {
      lines.push(`"${item.name}","${item.category}",${item.unit},${item.quantity},${item.rate},${item.quantity * item.rate}`);
    });
    lines.push('');
    lines.push('SUMMARY');
    lines.push('-'.repeat(50));
    lines.push(`Total Base Cost: ${formatCurrency(totalBaseCost)}`);
    lines.push(`Floor Factor: ${floorFactor.toFixed(2)}`);
    lines.push(`Area Multiplier: ${areaMultiplier.toFixed(2)}`);
    lines.push(`Grand Total: ${formatCurrency(totalCost)}`);
    lines.push(`Cost per sq.ft: ${formatCurrency(totalCost / (area * floors))}`);

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Estimation_${type}_${area}sqft.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredSaved = savedEstimations.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SelectedIcon = currentType.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estimation Module</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Comprehensive cost estimation for construction projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showSaved ? 'default' : 'outline'} size="sm" onClick={() => setShowSaved(!showSaved)}>
            <Save size={14} className="mr-1" /> Saved ({savedEstimations.length})
          </Button>
          <Button onClick={saveEstimation} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin mr-1" size={16} /> : <Download size={16} className="mr-1" />}
            {editingId ? 'Update' : 'Save Estimate'}
          </Button>
        </div>
      </div>

      <EngineeringDisclaimer compact />

      {showSaved && (
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input placeholder="Search saved estimates..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6" /></div>
            ) : filteredSaved.length === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">No saved estimates found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredSaved.map((est) => (
                  <div key={est.id} className="p-3 rounded-lg border border-[hsl(var(--border))] hover:border-primary/30 cursor-pointer transition-colors"
                    onClick={() => loadSavedEstimation(est)}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{est.title}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {est.buildingType} &middot; {est.area} sq.ft
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 shrink-0 ml-2"
                        onClick={(e) => { e.stopPropagation(); deleteSaved(est.id); }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Building2 size={18} /> Building Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {BUILDING_TYPES.map((bt) => {
                  const Icon = bt.icon;
                  return (
                    <button key={bt.value} onClick={() => setType(bt.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        type === bt.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-[hsl(var(--border))] hover:border-primary/30'
                      }`}>
                      <Icon size={24} className={`mx-auto mb-1 ${type === bt.value ? 'text-primary' : 'text-[hsl(var(--muted-foreground))]'}`} />
                      <p className={`text-xs font-medium ${type === bt.value ? 'text-primary' : ''}`}>{bt.label}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Calculator size={18} /> Project Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">Built-up Area (sq.ft)</label>
                  <Input type="number" value={area} onChange={(e) => setArea(parseFloat(e.target.value) || 0)} />
                  <div className="flex gap-1 mt-1">
                    {[500, 1000, 2000, 5000].map((v) => (
                      <button key={v} onClick={() => setArea(v)}
                        className="text-[10px] px-2 py-0.5 rounded bg-[hsl(var(--secondary))] hover:bg-primary/10 transition-colors">{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">Number of Floors</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 5, 10].map((v) => (
                      <button key={v} onClick={() => setFloors(v)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          floors === v ? 'bg-primary text-primary-foreground' : 'bg-[hsl(var(--secondary))] hover:bg-primary/10'
                        }`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">Project Name</label>
                  <Input value={estimationName} onChange={(e) => setEstimationName(e.target.value)} placeholder="Enter project name" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 cursor-pointer" onClick={() => setShowItems(!showItems)}>
                  <TrendingUp size={18} /> Rate Items ({items.length})
                  {showItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}><Plus size={12} className="mr-1" /> Add Item</Button>
              </div>
            </CardHeader>
            {showItems && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[10px] font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))/50] rounded-t-lg mb-1">
                  <div className="col-span-3">Item Name</div>
                  <div className="col-span-1">Category</div>
                  <div className="col-span-1 text-center">Unit</div>
                  <div className="col-span-2 text-right">Quantity</div>
                  <div className="col-span-2 text-right">Rate (₹)</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 px-2 py-1 items-center rounded hover:bg-[hsl(var(--secondary))/30] transition-colors group">
                      <div className="col-span-3">
                        <input placeholder="Item name" value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          className="w-full text-xs bg-transparent border-0 outline-none focus:ring-0 p-0" />
                      </div>
                      <div className="col-span-1">
                        <select value={item.category} onChange={(e) => updateItem(item.id, { category: e.target.value })}
                          className="w-full text-[10px] bg-[hsl(var(--secondary))] rounded px-1 py-0.5 border-0 outline-none">
                          {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <select value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                          className="w-full text-[10px] bg-[hsl(var(--secondary))] rounded px-1 py-0.5 border-0 outline-none text-center">
                          {DEFAULT_UNITS.map((u) => (<option key={u}>{u}</option>))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={item.quantity || ''}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} className="h-6 text-xs text-right" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={item.rate || ''}
                          onChange={(e) => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })} className="h-6 text-xs text-right" />
                      </div>
                      <div className="col-span-2 text-right text-xs font-medium">{formatCurrency(item.quantity * item.rate)}</div>
                      <div className="col-span-1 text-center">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-red-400 transition-opacity"
                          onClick={() => removeItem(item.id)}><Trash2 size={10} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
                  <span className="text-xs font-semibold">Base Total</span>
                  <span className="text-sm font-bold">{formatCurrency(totalBaseCost)}</span>
                </div>
              </CardContent>
            )}
          </Card>

          {Object.keys(categoryTotals).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp size={18} /> Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(categoryTotals).sort(([, a], [, b]) => b - a).map(([cat, total]) => {
                    const pct = totalBaseCost > 0 ? (total / totalBaseCost) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="font-medium">{cat}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">{formatCurrency(total)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Calculator size={16} /> Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-center">
                <p className="text-xs opacity-80 mb-1">Estimated Project Cost</p>
                <p className="text-3xl font-bold">{formatCurrency(totalCost)}</p>
                <p className="text-[10px] opacity-80 mt-1">{currentType.label} &middot; {area} sq.ft &middot; {floors} floor{floors > 1 ? 's' : ''}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-[hsl(var(--secondary))] text-center">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Per sq.ft</p>
                  <p className="text-lg font-bold">{formatCurrency(totalCost / (area * floors || 1))}</p>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(var(--secondary))] text-center">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Rate Range</p>
                  <p className="text-lg font-bold">{formatCurrency(currentType.minRate)} - {formatCurrency(currentType.maxRate)}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Base Material Cost</span>
                  <span className="font-medium">{formatCurrency(totalBaseCost)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Floor Factor (×{floorFactor.toFixed(2)})</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">+{formatCurrency(totalBaseCost * (floorFactor - 1) * areaMultiplier)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Area Factor (×{areaMultiplier.toFixed(2)})</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">{formatCurrency(totalBaseCost * floorFactor * (areaMultiplier - 1))}</span>
                </div>
                <hr className="border-[hsl(var(--border))]" />
                <div className="flex justify-between pt-1">
                  <span className="font-bold">Grand Total</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCost)}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Button className="w-full" onClick={saveEstimation} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin mr-1" size={14} /> : <Save size={14} className="mr-1" />}
                  {editingId ? 'Update' : 'Save'} Estimation
                </Button>
                <Button variant="outline" className="w-full" onClick={exportReport}>
                  <Download size={14} className="mr-1" /> Export CSV Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}