import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useList } from '@/hooks/useApi';
import { Search, Package, ChevronRight, Loader2, Eye, Download } from 'lucide-react';
import type { Material } from '@/types';

const categoryIcons: Record<string, string> = {
  CEMENT: '🧱', SAND: '⏳', AGGREGATE: '🪨', STEEL: '⚙️', BRICKS: '🧱',
  BLOCKS: '📦', TILES: '🔲', WOOD: '🪵', GLASS: '🪟', PVC: '🔧',
  PIPES: '🔩', PAINT: '🎨', ADMIXTURES: '🧪', OTHER: '📦',
};

export default function MaterialsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { data: response, isLoading } = useList<Material>('/materials', ['materials'], { search: search || undefined });

  const materials = response?.data || [];
  const categories = [...new Set(materials.map((m) => m.category))];

  const filtered = selectedCategory
    ? materials.filter((m) => m.category === selectedCategory)
    : materials;

  if (selectedMaterial) {
    const m = selectedMaterial;
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => setSelectedMaterial(null)}>← Back to Library</Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{categoryIcons[m.category] || '📦'}</span>
                <div>
                  <h1 className="text-xl font-bold">{m.name}</h1>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{m.category}</p>
                </div>
              </div>
              <p>{m.description || 'No description available.'}</p>
              {m.properties && m.properties.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Properties</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {m.properties.map((p, i) => (
                      <div key={i} className="p-2 rounded-lg border border-[hsl(var(--border))]">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{p.name}</p>
                        <p className="text-sm font-medium">{p.value}{p.unit ? ` ${p.unit}` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {m.uses && m.uses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Uses</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {m.uses.map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-4">
            {m.images && m.images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <img src={m.images[0]} alt={m.name} className="w-full rounded-lg" />
                </CardContent>
              </Card>
            )}
            {m.pdfCatalog && (
              <Button className="w-full" onClick={() => window.open(m.pdfCatalog, '_blank')}>
                <Eye size={16} className="mr-1" /> View Catalog
              </Button>
            )}
            {m.advantages && m.advantages.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Advantages</h3>
                  <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                    {m.advantages.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
            {m.disadvantages && m.disadvantages.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Disadvantages</h3>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {m.disadvantages.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Material Library</h1>
        <p className="text-[hsl(var(--muted-foreground))]">{materials.length} materials available</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
        <Input placeholder="Search materials..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant={!selectedCategory ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>All</Button>
        {categories.map((cat) => (
          <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}>
            {categoryIcons[cat] || '📦'} {cat}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]"><Package className="mx-auto h-12 w-12 mb-3 opacity-50" /><p>No materials found.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((material) => (
            <motion.div key={material.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedMaterial(material)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryIcons[material.category] || '📦'}</span>
                      <div>
                        <h3 className="font-medium">{material.name}</h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{material.category}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform" />
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