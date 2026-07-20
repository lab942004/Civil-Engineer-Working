import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { BarChart3, TrendingUp, Download, Users, HardDrive } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics({ days: 30 }).then(res => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 skeleton" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" />)}</div><div className="h-80 rounded-xl skeleton" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Failed to load analytics</div>;

  const dailyData = data.dailyUsage?.map((d: any) => ({ ...d, date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) })) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="text-gray-500 mt-1">Detailed analytics and insights</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Downloads', value: data.totalDownloads, icon: Download, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'New Users (30d)', value: data.totalNewUsers, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Storage Used (MB)', value: data.totalStorage, icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}><s.icon size={18} className={s.color} /></div>
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" />Daily Usage (30 days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="visitors" fill="#3b82f6" name="Visitors" radius={[4, 4, 0, 0]} />
              <Bar dataKey="downloads" fill="#10b981" name="Downloads" radius={[4, 4, 0, 0]} />
              <Bar dataKey="users" fill="#f59e0b" name="New Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Materials</h3>
          <div className="space-y-2">
            {data.recentMaterials?.slice(0, 5).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{m.name}</span>
                <span className="text-xs text-gray-400">{m.category}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recent IS Codes</h3>
          <div className="space-y-2">
            {data.recentISCodes?.slice(0, 5).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-mono text-blue-600">{c.code}</span>
                <span className="text-xs text-gray-400">{c.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}