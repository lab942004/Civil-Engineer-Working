import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../lib/utils';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DownloadsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    adminAPI.getDownloadReport({ page, limit: 20 }).then(res => {
      setData(res.data.data);
      setTotalPages(res.data.meta?.totalPages || 1);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-2xl font-bold text-gray-900">Downloads</h1><p className="text-gray-500 mt-1">Track file downloads</p></div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(3)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-5 skeleton w-full" /></td>)}</tr>) :
              data.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{d.user?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{d.entity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(d.createdAt)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
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