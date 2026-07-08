import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useList } from '@/hooks/useApi';
import type { ISCode } from '@/types';

export default function ISCodesPage() {
  const [search, setSearch] = useState('');
  const { data: response, isLoading } = useList<ISCode>('/iscodes', ['iscodes'], { search: search || undefined, limit: 100 });
  const isCodes = response?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">IS Codes Library</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Browse Indian Standard codes for civil engineering</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
        <Input placeholder="Search by code or title..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : isCodes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]">
            <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No IS codes found. They will be available after data seeding.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isCodes.map((code) => (
            <Card key={code.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-[hsl(221.2,83.2%,53.3%)]/10">
                      <BookOpen size={20} className="text-[hsl(221.2,83.2%,53.3%)]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{code.code}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{code.title}</p>
                      <div className="flex gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>Year: {code.year}</span>
                        {code.pages && <span>Pages: {code.pages}</span>}
                        <span>Category: {code.category}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          code.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          code.status === 'REVISED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{code.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {code.pdfUrl && (
                      <Button variant="ghost" size="icon" onClick={() => window.open(code.pdfUrl, '_blank')}>
                        <ExternalLink size={16} />
                      </Button>
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