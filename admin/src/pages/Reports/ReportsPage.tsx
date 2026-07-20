import { useState } from 'react';
import { adminAPI } from '../../services/api';
import { FileText, Download, Users, Activity, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [tab, setTab] = useState<'users' | 'downloads' | 'activity' | 'materials' | 'learning'>('users');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      let res;
      switch (tab) {
        case 'users': res = await adminAPI.getUserReport(params); break;
        case 'downloads': res = await adminAPI.getDownloadReport(params); break;
        case 'activity': res = await adminAPI.getActivityReport(params); break;
        case 'materials': res = await adminAPI.getMaterialReport(); break;
        case 'learning': res = await adminAPI.getLearningReport(); break;
      }
      setData(res?.data?.data);
      setTotalPages(res?.data?.meta?.totalPages || 1);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = Array.isArray(data) ? data : [data];
    const headers = Object.keys(rows[0] || {}).join(',');
    const csv = [headers, ...rows.map((r: any) => Object.values(r).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${tab}-report.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-gray-500 mt-1">Generate and export reports</p></div>
        {data && <button onClick={exportCSV} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md"><Download size={16} /> Export CSV</button>}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['users', 'downloads', 'activity', 'materials', 'learning'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
          ))}
        </div>
        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-xs" />
        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-xs" />
        <button onClick={loadReport} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors">Load</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {tab === 'users' && <><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th></>}
                {tab === 'downloads' && <><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th></>}
                {tab === 'activity' && <><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th></>}
                {tab === 'materials' && <><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th></>}
                {tab === 'learning' && <><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th></>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(4)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-5 skeleton w-full" /></td>)}</tr>) :
                !data || (Array.isArray(data) && data.length === 0) ? <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No data</td></tr> :
                tab === 'users' && Array.isArray(data) && data.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.role}</td>
                    <td className="px-4 py-3"><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))
              }
              {tab === 'activity' && Array.isArray(data) && data.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{l.admin?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{l.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{l.entity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}