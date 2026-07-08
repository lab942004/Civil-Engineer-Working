import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Memory storage: files are held in RAM only long enough to stream them to
// Cloudinary — nothing ever touches the local disk, so there's no local
// file cleanup or path-traversal surface to worry about.
const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = new Set([
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt',
  // CAD / engineering drawing formats
  'dwg', 'dxf', 'dgn',
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new AppError(`File type ".${ext}" is not allowed`, 400) as any);
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter,
});

export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);