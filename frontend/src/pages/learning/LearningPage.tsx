import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { GraduationCap, BookOpen, Video, FileQuestion, ChevronRight, Loader2 } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={24} />,
  Video: <Video size={24} />,
  FileQuestion: <FileQuestion size={24} />,
};

const colorMap: Record<string, string> = {
  BookOpen: 'from-blue-500 to-blue-600',
  Video: 'from-purple-500 to-purple-600',
  FileQuestion: 'from-orange-500 to-orange-600',
};

export default function LearningPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get<any[]>('/learning/categories');
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to static data
      setCategories([
        { name: 'Articles', count: 45, icon: 'BookOpen', color: 'from-blue-500 to-blue-600' },
        { name: 'Tutorials', count: 30, icon: 'Video', color: 'from-purple-500 to-purple-600' },
        { name: 'IS Codes Guide', count: 25, icon: 'BookOpen', color: 'from-green-500 to-green-600' },
        { name: 'MCQ Tests', count: 500, icon: 'FileQuestion', color: 'from-orange-500 to-orange-600' },
        { name: 'Interview Questions', count: 200, icon: 'FileQuestion', color: 'from-red-500 to-red-600' },
        { name: 'Video Lectures', count: 60, icon: 'Video', color: 'from-teal-500 to-teal-600' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Learning Center</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Expand your civil engineering knowledge</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <Card key={i} className="group cursor-pointer hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${cat.color || colorMap[cat.icon] || 'from-blue-500 to-blue-600'} text-white`}>
                      {iconMap[cat.icon] || <BookOpen size={24} />}
                    </div>
                    <div>
                      <h3 className="font-medium">{cat.name}</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{cat.count} items</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}