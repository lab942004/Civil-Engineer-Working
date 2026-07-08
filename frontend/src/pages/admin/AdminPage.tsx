import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Shield, Users, BookOpen, Package, FileText, Activity, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get<any>('/admin/dashboard');
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const adminCards = [
    { name: 'Manage Users', count: stats?.users || '0', icon: <Users size={24} />, color: 'from-blue-500 to-blue-600' },
    { name: 'IS Codes', count: stats?.isCodes || '0', icon: <BookOpen size={24} />, color: 'from-green-500 to-green-600' },
    { name: 'Materials', count: stats?.materials || '0', icon: <Package size={24} />, color: 'from-orange-500 to-orange-600' },
    { name: 'Reports', count: stats?.reports || '0', icon: <FileText size={24} />, color: 'from-purple-500 to-purple-600' },
    { name: 'Projects', count: stats?.projects || '0', icon: <Activity size={24} />, color: 'from-red-500 to-red-600' },
    { name: 'Analytics', count: '12', icon: <Activity size={24} />, color: 'from-teal-500 to-teal-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield size={24} className="text-[hsl(221.2,83.2%,53.3%)]" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminCards.map((card) => (
            <Card key={card.name} className="cursor-pointer hover:shadow-lg transition-all group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white group-hover:scale-110 transition-transform`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{card.name}</h3>
                      <p className="text-2xl font-bold">{card.count}</p>
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