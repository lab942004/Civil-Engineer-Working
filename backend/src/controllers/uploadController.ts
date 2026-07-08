import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { uploadBufferToCloud, deleteFromCloud } from '../services/uploadService';
import { paginate, buildPaginationMeta } from '../utils/helpers';

const resourceTypeFromFormat = (format: string): 'image' | 'raw' =>
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg'].includes(format.toLowerCase())
    ? 'image'
    : 'raw';

export const uploadFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file was provided', 400);

    const folder = String(req.body.folder || 'general');
    const result = await uploadBufferToCloud(req.file.buffer, req.file.originalname, folder);

    const record = await prisma.projectFile.create({
      data: {
        originalName: req.file.originalname,
        url: result.url,
        publicId: result.publicId,
        size: req.file.size,
        format: result.format,
        folder,
        category: req.body.category || null,
        notes: req.body.notes || null,
        rateItems: req.body.rateItems ? JSON.parse(req.body.rateItems) : undefined,
        projectId: req.body.projectId || null,
        uploadedById: req.user!.id,
      },
    });

    res.status(201).json({ success: true, message: 'File uploaded successfully', data: record });
  } catch (error) { next(error); }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No image was provided', 400);
    const ext = req.file.originalname.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      throw new AppError('Profile picture must be an image (jpg, png, webp, or gif)', 400);
    }

    const result = await uploadBufferToCloud(req.file.buffer, req.file.originalname, 'avatars');

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: result.url },
      select: { id: true, name: true, email: true, avatar: true },
    });

    res.json({ success: true, message: 'Profile picture updated', data: user });
  } catch (error) { next(error); }
};

export const listFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, folder, projectId, category } = req.query;
    const where: any = { uploadedById: req.user!.id };
    if (folder) where.folder = String(folder);
    if (projectId) where.projectId = String(projectId);
    if (category) where.category = String(category);

    const { skip, take } = paginate(page ? parseInt(String(page)) : 1, limit ? parseInt(String(limit)) : 20);

    const [data, total] = await Promise.all([
      prisma.projectFile.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.projectFile.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      meta: buildPaginationMeta(total, page ? parseInt(String(page)) : 1, limit ? parseInt(String(limit)) : 20),
    });
  } catch (error) { next(error); }
};

export const updateFileMeta = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.projectFile.findUnique({ where: { id } });
    if (!existing) throw new AppError('File not found', 404);
    if (existing.uploadedById !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { category, notes, rateItems } = req.body;
    const updated = await prisma.projectFile.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(notes !== undefined && { notes }),
        ...(rateItems !== undefined && { rateItems }),
      },
    });

    res.json({ success: true, message: 'File updated', data: updated });
  } catch (error) { next(error); }
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.projectFile.findUnique({ where: { id } });
    if (!existing) throw new AppError('File not found', 404);
    if (existing.uploadedById !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await deleteFromCloud(existing.publicId, resourceTypeFromFormat(existing.format));
    await prisma.projectFile.delete({ where: { id } });

    res.json({ success: true, message: 'File deleted' });
  } catch (error) { next(error); }
};
