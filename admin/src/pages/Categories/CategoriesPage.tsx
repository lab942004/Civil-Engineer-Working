import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FolderTree, BookOpen, FileCode } from 'lucide-react';

export default function CategoriesPage() {
  const [materialCats, setMaterialCats] = useState<any[]>([]);
  const [isCodeCats, setIsCodeCats] = useState<any[]>([]);
  const [learningCats, setLearningCats] = useState<any>(null);
  const [tab, setTab] = useState<'materials' | 'iscodes' | 'learning'>('materials');

  useEffect(() => {
    adminAPI.getMaterialCategories().then(res => setMaterialCats(res.data.data)).catch(() => {});
    adminAPI.getISCodeCategories().then(res => setIsCodeCats(res.data.data)).catch(() => {});
    adminAPI.getLearningCategories().then(res => setLearningCats(res.data.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-1">Manage content categories</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('materials')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'materials' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Materials</button>
        <button onClick={() => setTab('iscodes')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'iscodes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>IS Codes</button>
        <button onClick={() => setTab('learning')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'learning' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Learning</button>
      </div>

      {tab === 'materials' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materialCats.map((c: any) => (
            <div key={c.category} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen size={20} className="text-blue-500" />
                  <span className="font-medium text-gray-900">{c.category}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{c._count}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">materials</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'iscodes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCodeCats.map((c: any) => (
            <div key={c.category} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCode size={20} className="text-orange-500" />
                  <span className="font-medium text-gray-900">{c.category}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{c._count}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">codes</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'learning' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-4">Article Categories</h3>
            {learningCats?.articles?.map((c: any) => (
              <div key={c.category} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500">{c.category}</span>
                <span className="text-sm font-medium text-gray-900">{c._count}</span>
              </div>
            ))}
            {(!learningCats?.articles || learningCats.articles.length === 0) && <p className="text-sm text-gray-400 py-4 text-center">No categories</p>}
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-4">Tutorial Categories</h3>
            {learningCats?.tutorials?.map((c: any) => (
              <div key={c.category} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500">{c.category}</span>
                <span className="text-sm font-medium text-gray-900">{c._count}</span>
              </div>
            ))}
            {(!learningCats?.tutorials || learningCats.tutorials.length === 0) && <p className="text-sm text-gray-400 py-4 text-center">No categories</p>}
          </div>
        </div>
      )}
    </div>
  );
}