import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminAuth';
import type { AuthenticatedRequest } from '../types';
import { uploadFile, uploadAvatar, listFiles, updateFileMeta, deleteFile } from '../controllers/uploadController';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-rar-compressed',
  'text/plain', 'text/csv',
];

const storage = multer.memoryStorage();

function buildUploader(maxSizeBytes: number) {
  return multer({
    storage,
    limits: { fileSize: maxSizeBytes },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`));
      }
    },
  });
}

// Standard cap for everyday uploads (drawings, site photos, reports, etc).
// Configurable via MAX_FILE_SIZE env var; defaults to 10MB.
const standardUpload = buildUploader(config.upload.maxFileSize);

// Reference-library PDFs (IS Codes) are legitimately large scanned
// documents, so admins get a much higher ceiling for that folder only.
const IS_CODE_MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const largeUpload = buildUploader(IS_CODE_MAX_SIZE_BYTES);

// Folders that qualify for the larger limit. Read from the query string
// (not the multipart body) because query params are available before
// multer starts streaming the file, so the right size limit can be picked
// up front instead of after the file has already been rejected/accepted.
const LARGE_UPLOAD_FOLDERS = new Set(['iscodes']);

function pickAdminUploader(req: AuthenticatedRequest) {
  const folder = String(req.query.folder || req.body?.folder || '');
  return LARGE_UPLOAD_FOLDERS.has(folder) ? largeUpload : standardUpload;
}

// ==========================================================================
// Admin generic Cloudinary passthrough (no DB record - used for content like
// IS Codes / Materials / Articles / Tutorials, where the URL is stored
// directly on that content's own row, e.g. ISCode.pdfUrl).
// ==========================================================================

router.post(
  '/upload',
  authenticate,
  adminOnly,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const singleUpload = pickAdminUploader(req).single('file');
    singleUpload(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file provided' });
        }

        const folder = String(req.query.folder || req.body.folder || 'admin-uploads');

        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'auto',
              public_id: `${Date.now()}-${path.parse(req.file!.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          const readable = new Readable();
          readable.push(req.file!.buffer);
          readable.push(null);
          readable.pipe(uploadStream);
        });

        res.json({
          success: true,
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            originalName: req.file.originalname,
            size: req.file.size.toString(),
            format: result.format,
            width: result.width,
            height: result.height,
          },
          message: 'File uploaded successfully',
        });
      } catch (error: any) {
        next(error);
      }
    });
  }
);

router.post(
  '/upload-multiple',
  authenticate,
  adminOnly,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const multipleUpload = pickAdminUploader(req).array('files', 10);
    multipleUpload(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ success: false, message: 'No files provided' });
        }

        const folder = String(req.query.folder || req.body.folder || 'admin-uploads');

        const uploadPromises = files.map((file) => {
          return new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type: 'auto',
                public_id: `${Date.now()}-${path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            const readable = new Readable();
            readable.push(file.buffer);
            readable.push(null);
            readable.pipe(uploadStream);
          });
        });

        const results = await Promise.all(uploadPromises);

        res.json({
          success: true,
          data: results.map((r: any) => ({
            url: r.secure_url,
            publicId: r.public_id,
            originalName: files[results.indexOf(r)].originalname,
            size: files[results.indexOf(r)].size.toString(),
            format: r.format,
          })),
          message: 'Files uploaded successfully',
        });
      } catch (error: any) {
        next(error);
      }
    });
  }
);

// ==========================================================================
// User-facing file management (ProjectFile records in Postgres, scoped to
// the uploading user) - backs the /uploads list+upload+edit+delete UI used
// by Drawings, Inspection attachments, and Site Diary photos.
//
// PREVIOUSLY MISSING: uploadController.ts already implemented uploadFile /
// listFiles / updateFileMeta / deleteFile, but no route file ever wired them
// up, so every one of these requests 404'd ("route error") before reaching
// any database code - this was a routing gap, not a DB problem.
// ==========================================================================

router.get('/', authenticate, listFiles);

router.post(
  '/',
  authenticate,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const singleUpload = standardUpload.single('file');
    singleUpload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      uploadFile(req, res, next);
    });
  }
);

router.post(
  '/avatar',
  authenticate,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const singleUpload = standardUpload.single('file');
    singleUpload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      uploadAvatar(req, res, next);
    });
  }
);

router.put('/:id', authenticate, updateFileMeta);
router.delete('/:id', authenticate, deleteFile);

export default router;
