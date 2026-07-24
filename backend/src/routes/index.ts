import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { adminOnly } from '../middleware/adminAuth';
import { createCrudController } from '../controllers/crudController';
import { CrudService } from '../services/crudService';
import authRoutes from './authRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);

// Generic CRUD route factory with optional user-scoping.
//
// SECURITY FIX (audit finding): materials/iscodes/calculators/learning
// articles+tutorials are shared reference content meant to be managed only
// through the admin panel, but were registered here with no `roles` and no
// scoping at all - meaning ANY authenticated user (a STUDENT, CONTRACTOR,
// etc.) could POST/PUT/DELETE them directly via this public API, not just
// read them. `adminWriteOnly` keeps GET open to any authenticated user
// (intentional - everyone should be able to read this content) while
// requiring ADMIN/SUPER_ADMIN for create/update/delete.
function createCrudRoutes(
  basePath: string,
  service: any,
  entityName: string,
  roles?: string[],
  scopeToUser: boolean = false,
  adminWriteOnly: boolean = false
) {
  const controller = createCrudController(service, entityName, scopeToUser);
  const readAuth = roles ? [authenticate, authorize(...roles)] : [authenticate];
  const writeAuth = adminWriteOnly ? [authenticate, adminOnly] : readAuth;

  router.get(`/${basePath}`, ...readAuth, controller.list);
  router.get(`/${basePath}/:id`, ...readAuth, controller.getById);
  router.post(`/${basePath}`, ...writeAuth, controller.create);
  router.put(`/${basePath}/:id`, ...writeAuth, controller.update);
  router.delete(`/${basePath}/:id`, ...writeAuth, controller.delete);
}

// Helper to create services for additional models
const prismaModels = ['ProjectMember', 'User', 'Role', 'Settings', 'SavedCalculation', 'Article', 'Tutorial', 'UnitConversion', 'RateAnalysis'];
const modelServices: Record<string, any> = {};
prismaModels.forEach((model) => {
  modelServices[model] = new CrudService(model);
});

// ==================== MODULE ROUTES ====================

import {
  projectService, materialService, isCodeService, boqService,
  estimationService, inspectionService, reportService, noteService,
  notificationService, calculatorService, dailyProgressService,
  projectFileService, feedbackService, supportTicketService,
} from '../services/crudService';

// User-scoped routes (filter by userId automatically)
createCrudRoutes('projects', projectService, 'Project', undefined, true);
createCrudRoutes('project-members', modelServices['ProjectMember'], 'ProjectMember');
// Shared reference content: readable by any authenticated user, writable
// only by admins (see createCrudRoutes comment above for why this matters).
createCrudRoutes('calculators', calculatorService, 'Calculator', undefined, false, true);
createCrudRoutes('materials', materialService, 'Material', undefined, false, true);
createCrudRoutes('iscodes', isCodeService, 'ISCode', undefined, false, true);
createCrudRoutes('boq', boqService, 'BOQ', undefined, true);
createCrudRoutes('estimations', estimationService, 'Estimation', undefined, true);
createCrudRoutes('inspections', inspectionService, 'Inspection', undefined, true);
createCrudRoutes('daily-progress', dailyProgressService, 'DailyProgress', undefined, true);
// SECURITY FIX: Report had no owner column and no scoping at all - any
// authenticated user could list/edit/delete any other user's project
// reports. Added a `userId` column to Report (schema.prisma) and scope this
// route the same way projects/boq/estimations/etc. already are.
createCrudRoutes('reports', reportService, 'Report', undefined, true);
createCrudRoutes('notes', noteService, 'Note', undefined, true);
// File uploads are now handled by uploadRoutes (mounted at /uploads), which
// correctly stamps `uploadedById` and talks to Cloudinary. The old generic
// CRUD route here never worked: createCrudController only knows how to
// auto-inject a `userId` field, but ProjectFile uses `uploadedById`, so any
// create through this route would have thrown a required-field DB error.
createCrudRoutes('notifications', notificationService, 'Notification', undefined, true);
createCrudRoutes('feedback', feedbackService, 'Feedback', undefined, true);
createCrudRoutes('support-tickets', supportTicketService, 'SupportTicket', undefined, true);

// Learning & Reference routes (admin-managed content, public read)
createCrudRoutes('learning/articles', modelServices['Article'], 'Article', undefined, false, true);
createCrudRoutes('learning/tutorials', modelServices['Tutorial'], 'Tutorial', undefined, false, true);
// SECURITY FIX: UnitConversion has a userId column but wasn't scoped, so any
// authenticated user could read/edit/delete any other user's saved
// conversions.
createCrudRoutes('unit-conversions', modelServices['UnitConversion'], 'UnitConversion', undefined, true);

// User-specific data routes
createCrudRoutes('saved-calculations', modelServices['SavedCalculation'], 'SavedCalculation', undefined, true);
createCrudRoutes('rate-analysis', modelServices['RateAnalysis'], 'RateAnalysis', undefined, true);
createCrudRoutes('settings', modelServices['Settings'], 'Settings', undefined, true);

// Calculator categories
router.get('/calculators/categories', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.calculatorCategory.findMany({ include: { calculators: { include: { inputs: true } } } });
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
});

// Dashboard stats
router.get('/dashboard/stats', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const [totalProjects, totalCalculations, savedMaterials, isCodesCount, recentActivities, savedCalculations, favoriteTools, latestISCodes, projectStats] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.savedCalculation.count({ where: { userId } }),
      prisma.material.count(),
      prisma.iSCode.count(),
      prisma.activityLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, where: { userId }, include: { user: { select: { name: true, avatar: true } } } }),
      prisma.savedCalculation.findMany({ take: 5, orderBy: { createdAt: 'desc' }, where: { userId } }),
      prisma.calculator.findMany({ take: 4 }),
      prisma.iSCode.findMany({ take: 3, orderBy: { createdAt: 'desc' } }),
      prisma.project.groupBy({ by: ['status'], _count: true, where: { userId } }),
    ]);
    const activeProjects = await prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } });
    res.json({
      success: true, data: {
        totalProjects, activeProjects, totalCalculations, savedMaterials: savedMaterials,
        recentActivities, savedCalculations, favoriteTools, latestISCodes,
        projectStats: projectStats.map((p: any) => ({ status: p.status, count: p._count })),
        profileCompletion: 75, announcements: [],
      }
    });
  } catch (error) { next(error); }
});

// Activity Logs
router.get('/activities', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const logs = await prisma.activityLog.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      where: { userId },
      include: { user: { select: { name: true, avatar: true } } },
    });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
});

// Profile update (self)
router.put('/profile/update', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const { name, phone, bio, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, bio, avatar },
      select: { id: true, email: true, name: true, role: true, avatar: true, phone: true, bio: true, isVerified: true, isActive: true, createdAt: true, updatedAt: true },
    });
    res.json({ success: true, data: user, message: 'Profile updated successfully' });
  } catch (error) { next(error); }
});

// Get current user profile
router.get('/profile/me', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, phone: true, bio: true, isVerified: true, isActive: true, createdAt: true, updatedAt: true },
    });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

// Change password
router.put('/profile/change-password', authenticate, async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) { next(error); }
});

// Learning categories
router.get('/learning/categories', authenticate, async (req, res, next) => {
  try {
    const [articles, tutorials] = await Promise.all([
      prisma.article.count(),
      prisma.tutorial.count(),
    ]);
    res.json({
      success: true, data: [
        { name: 'Articles', count: articles, icon: 'BookOpen', color: 'from-blue-500 to-blue-600' },
        { name: 'Tutorials', count: tutorials, icon: 'Video', color: 'from-purple-500 to-purple-600' },
        { name: 'IS Codes Guide', count: 25, icon: 'BookOpen', color: 'from-green-500 to-green-600' },
        { name: 'MCQ Tests', count: 500, icon: 'FileQuestion', color: 'from-orange-500 to-orange-600' },
        { name: 'Interview Questions', count: 200, icon: 'FileQuestion', color: 'from-red-500 to-red-600' },
        { name: 'Video Lectures', count: 60, icon: 'Video', color: 'from-teal-500 to-teal-600' },
      ]
    });
  } catch (error) { next(error); }
});

export default router;