import { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadResult {
  url: string;
  publicId: string;
  originalName: string;
  size: string;
  format: string;
}

interface FileUploadProps {
  onUpload: (result: UploadResult) => void;
  onRemove?: () => void;
  currentUrl?: string;
  accept?: string;
  label?: string;
  folder?: string;
  multiple?: boolean;
  /** Max client-side file size in MB before even attempting the upload (default: 10MB) */
  maxSizeMB?: number;
}

export default function FileUpload({
  onUpload,
  onRemove,
  currentUrl,
  accept = 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.csv,.txt',
  label = 'Upload File',
  folder = 'admin-uploads',
  maxSizeMB = 10,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

      // folder is passed both as a query param (so the backend can pick the
      // right size limit / storage bucket before it starts parsing the
      // multipart body) and in the form body (used once the upload record
      // itself is created).
      const res = await fetch(`${API_BASE}/uploads/upload?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      const result = data.data;
      setPreview(result.url);

      // Show preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }

      onUpload(result);
      toast.success('File uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <Image size={24} className="text-blue-500" />;
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return <Video size={24} className="text-purple-500" />;
    if (['pdf'].includes(ext || '')) return <FileText size={24} className="text-red-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  const isImageUrl = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Preview / Current file */}
      {preview && (
        <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
          {isImageUrl(preview) ? (
            <img src={preview} alt="Preview" className="w-full h-32 object-contain" />
          ) : (
            <div className="flex items-center gap-3 p-4">
              {getFileIcon(preview)}
              <span className="text-sm text-gray-600 truncate flex-1">
                {preview.split('/').pop() || 'Uploaded file'}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 shadow-sm transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload button */}
      {!preview && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload size={20} className="text-gray-400" />
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-xs text-gray-400">Click to browse files</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}