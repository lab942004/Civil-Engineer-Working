import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, FileCode, GraduationCap, Download,
  FolderTree, HardDrive, UserCheck, TrendingUp, Activity,
  Clock, ArrowUp, ArrowDown, Eye, FileText,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalProjects: number;
    totalMaterials: number;
    totalISCodes: number;
    totalArticles: number;
    totalTutorials: number;
    totalDownloads: number;
    totalCategories: number;
    totalStorage: number;
    todayVisitors: number;
    monthlyVisitors: number;
    activeUsers: number;
    systemHealthy: boolean;
  };
  recentUploads: any[];
  recentDownloads: any[];
  recentActivities: any[];
  visitorStats: { date: string; count: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const res = await adminAPI.getDashboard();
      setData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load dashboard', err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err.message || 'Failed to load dashboard';
      
      if (status === 401) {
        navigate('/login');
        return;
      }
      
      setError({ status, message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    if (error.status === 403) {
      return <DashboardError message="You are not authorized to view this page." />;
    }
    return <DashboardError message={error.message} />;
  }

  if (!data) return <DashboardError message="Failed to load dashboard data. Please try again." />;

  const statCards = [
    { label: 'Total Users', value: data.stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Projects', value: data.stats.totalProjects, icon: FolderTree, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Materials', value: data.stats.totalMaterials, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'IS Codes', value: data.stats.totalISCodes, icon: FileCode, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Articles', value: data.stats.totalArticles, icon: GraduationCap, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Downloads', value: data.stats.totalDownloads, icon: Download, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'Storage (MB)', value: data.stats.totalStorage.toFixed(1), icon: HardDrive, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Visitors Today', value: data.stats.todayVisitors, icon: Eye, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your application</p>
      </div>

      {/* System Health Banner */}
      <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${data.stats.systemHealthy ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${data.stats.systemHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        <span className={`text-sm font-medium ${data.stats.systemHealthy ? 'text-emerald-700' : 'text-red-700'}`}>
          System {data.stats.systemHealthy ? 'Healthy' : 'Issues Detected'}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={card.color} size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Chart */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Visitor Statistics (30 days)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.visitorStats}>
                <defs>
                  <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#visitorGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {data.recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No recent activities</p>
            ) : (
              data.recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Activity size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.details || activity.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowUp size={18} className="text-emerald-500" />
            Recent Uploads
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.recentUploads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No uploads yet</p>
            ) : (
              data.recentUploads.map((file: any) => (
                <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText size={16} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-400">{file.uploadedBy?.name} • {formatDate(file.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Downloads */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowDown size={18} className="text-blue-500" />
            Recent Downloads
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.recentDownloads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No downloads yet</p>
            ) : (
              data.recentDownloads.map((dl: any) => (
                <div key={dl.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download size={16} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{dl.entity || 'Download'}</p>
                    <p className="text-xs text-gray-400">{dl.user?.name} • {formatDate(dl.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl skeleton" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl skeleton" />
        <div className="h-80 rounded-xl skeleton" />
      </div>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
        <p className="text-gray-500 mb-4">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );
}