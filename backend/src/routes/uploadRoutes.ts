import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminAuth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Configure multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    // Allow images, videos, PDFs, and documents
    const allowedMimes = [
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
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// Upload file to Cloudinary
router.post(
  '/upload',
  authenticate,
  adminOnly,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const singleUpload = upload.single('file');
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

        const folder = String(req.body.folder || 'admin-uploads');

        // Upload buffer to Cloudinary
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

// Upload multiple files to Cloudinary
router.post(
  '/upload-multiple',
  authenticate,
  adminOnly,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const multipleUpload = upload.array('files', 10);
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

        const folder = String(req.body.folder || 'admin-uploads');

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

export default router;