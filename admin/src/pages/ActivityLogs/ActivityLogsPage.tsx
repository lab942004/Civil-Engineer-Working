import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../lib/utils';
import { Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    adminAPI.getActivityLogs({ page, limit: 30 }).then(res => {
      setLogs(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1><p className="text-gray-500 mt-1">Track admin actions</p></div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100">
          {loading ? [...Array(10)].map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><div className="w-8 h-8 rounded-full skeleton" /><div className="flex-1"><div className="h-4 skeleton w-3/4 mb-1" /><div className="h-3 skeleton w-1/4" /></div></div>) :
            logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Activity size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{log.admin?.name}</span>
                    {' '}{log.details || log.action}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="badge badge-gray text-[10px]">{log.entity}</span>
                    <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                    {log.ipAddress && <span className="text-xs text-gray-400">IP: {log.ipAddress}</span>}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}