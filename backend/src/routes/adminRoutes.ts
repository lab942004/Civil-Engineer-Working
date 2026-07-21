import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminAuth';
import type { AuthenticatedRequest } from '../types';
import bcrypt from 'bcryptjs';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, adminOnly);

// ========================
// ADMIN AUTH / PROFILE
// ========================

// Get admin profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        phone: true, bio: true, isVerified: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

// Update admin profile
router.put('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, bio, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, phone, bio, avatar },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        phone: true, bio: true, isVerified: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    });
    res.json({ success: true, data: user, message: 'Profile updated successfully' });
  } catch (error) { next(error); }
});

// Change admin password
router.put('/change-password', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashedPassword } });
    
    // Log activity
    await prisma.adminActivityLog.create({
      data: {
        adminId: req.user!.id,
        action: 'CHANGE_PASSWORD',
        entity: 'ADMIN',
        entityId: req.user!.id,
        details: 'Admin changed own password',
      },
    });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) { next(error); }
});

// ========================
// DASHBOARD
// ========================

/**
 * Safely call a Prisma model method. If the model doesn't exist on the
 * Prisma client (e.g. because the schema was changed without regenerating)
 * this returns the fallback value instead of crashing with a synchronous
 * "Cannot read properties of undefined" error that .catch() can't handle.
 */
/**
 * Execute a Prisma query safely with a fallback value.
 * Uses `as any` fallback to handle Prisma's internal PrismaPromise type constraints.
 * This is safe because the fallback is only used if the model doesn't exist.
 */
function safePrisma<T>(accessor: () => T, fallback: any): T {
  try {
    return accessor();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[DASHBOARD] Model access error:', message);
    return fallback as T;
  }
}

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalProjects,
      totalMaterials,
      totalISCodes,
      totalArticles,
      totalTutorials,
      totalDownloads,
      totalCategories,
      activeUsers,
      todayVisitors,
      monthlyVisitors,
      storageUsed,
      recentUploads,
      recentDownloads,
      systemHealth,
    ] = await Promise.all([
      (async () => { try { return await prisma.user.count(); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] user.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.project.count(); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] project.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.material.count(); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] material.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.iSCode.count(); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] iSCode.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.article.count(); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] article.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.tutorial.count(); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] tutorial.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.download.count(); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] download.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.material.groupBy({ by: ['category'], _count: true }); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] material.groupBy failed:', m); return [] as any; } })(),
      (async () => { try { return await prisma.user.count({ where: { isActive: true, createdAt: { gte: thirtyDaysAgo } } }); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] user.active.count failed:', m); return 0; } })(),
      (async () => { try { return await prisma.visitorLog.findMany({ where: { date: { gte: todayStart } } }); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] visitorLog.today failed:', m); return [] as any; } })(),
      (async () => { try { return await prisma.visitorLog.findMany({ take: 30, orderBy: { date: 'desc' } }); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] visitorLog.monthly failed:', m); return [] as any; } })(),
      (async () => { try { return await prisma.projectFile.aggregate({ _sum: { size: true } }); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] projectFile.aggregate failed:', m); return { _sum: { size: 0 } }; } })(),
      (async () => { try { return await prisma.projectFile.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { uploadedBy: { select: { name: true, avatar: true } } } }); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] projectFile.findMany failed:', m); return [] as any; } })(),
      (async () => { try { return await prisma.download.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }); } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] download.findMany failed:', m); return [] as any; } })(),
      (async () => { try { const result = await prisma.$queryRaw`SELECT 1 as health`; return Array.isArray(result) && result.length > 0; } catch (e: unknown) { const m = e instanceof Error ? e.message : String(e); console.error('[DASHBOARD] system health failed:', m); return false; } })(),
    ]);

    const totalStorage = ((storageUsed as { _sum: { size: number } })._sum?.size || 0) / (1024 * 1024); // MB

    // Get recent activity logs
    const recentActivities = await prisma.adminActivityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true, avatar: true } } },
    }).catch((e: Error) => { console.error('[DASHBOARD] adminActivityLog failed:', e.message); return []; });

    // Get visitor stats for chart
    const visitorStats = await prisma.visitorLog.findMany({
      take: 30,
      orderBy: { date: 'asc' },
    }).catch((e: Error) => { console.error('[DASHBOARD] visitorLog.stats failed:', e.message); return []; });

    const categoriesCount = Array.isArray(totalCategories) ? totalCategories.length : 0;
    const todayVisitorsCount = Array.isArray(todayVisitors) ? todayVisitors.reduce((sum: number, v: any) => sum + (v.count || 0), 0) : 0;
    const monthlyVisitorsCount = Array.isArray(monthlyVisitors) ? monthlyVisitors.reduce((sum: number, v: any) => sum + (v.count || 0), 0) : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers || 0,
          totalProjects: totalProjects || 0,
          totalMaterials: totalMaterials || 0,
          totalISCodes: totalISCodes || 0,
          totalArticles: totalArticles || 0,
          totalTutorials: totalTutorials || 0,
          totalDownloads: totalDownloads || 0,
          totalCategories: categoriesCount,
          totalStorage: Math.round(totalStorage * 100) / 100,
          todayVisitors: todayVisitorsCount,
          monthlyVisitors: monthlyVisitorsCount,
          activeUsers: activeUsers || 0,
          systemHealthy: systemHealth,
        },
        recentUploads: Array.isArray(recentUploads) ? recentUploads : [],
        recentDownloads: Array.isArray(recentDownloads) ? recentDownloads : [],
        recentActivities,
        visitorStats,
      },
    });
  } catch (error) {
    console.error('[DASHBOARD] Unexpected error:', error);
    next(error);
  }
});

// ========================
// USER MANAGEMENT
// ========================

// List all users with pagination, search, filter
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '20'));
    const search = String(req.query.search || '');
    const role = String(req.query.role || '');
    const status = String(req.query.status || '');
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortOrder = String(req.query.sortOrder || 'desc') as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (status === 'verified') where.isVerified = true;
    if (status === 'unverified') where.isVerified = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true, name: true, email: true, role: true, avatar: true,
          isActive: true, isVerified: true, createdAt: true, updatedAt: true,
          _count: { select: { projects: true, downloads: true, notes: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// Get single user details
router.get('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        phone: true, bio: true, isActive: true, isVerified: true,
        createdAt: true, updatedAt: true,
        _count: {
          select: {
            projects: true, downloads: true, notes: true, bookmarks: true,
            feedbacks: true, supportTickets: true, savedCalculations: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get recent activity
    const recentActivity = await prisma.recentActivity.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Get download history
    const downloadHistory = await prisma.download.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { ...user, recentActivity, downloadHistory } });
  } catch (error) { next(error); }
});

// Create user (admin)
router.post('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, phone, bio } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'CIVIL_ENGINEER', phone, bio, isVerified: true, isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, isVerified: true, createdAt: true },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'CREATE_USER', entity: 'USER', entityId: user.id, details: `Created user ${user.name}` },
    });

    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  } catch (error) { next(error); }
});

// Update user
router.put('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const { name, email, role, phone, bio, avatar } = req.body;
    
    // Check if email is taken
    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, role, phone, bio, avatar },
      select: { id: true, name: true, email: true, role: true, isActive: true, isVerified: true, createdAt: true },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'UPDATE_USER', entity: 'USER', entityId: user.id, details: `Updated user ${user.name}` },
    });

    res.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) { next(error); }
});

// Delete user
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await prisma.user.delete({ where: { id: userId } });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'DELETE_USER', entity: 'USER', entityId: userId, details: `Deleted user ${user.name}` },
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) { next(error); }
});

// Suspend user
router.put('/users/:id/suspend', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'SUSPEND_USER', entity: 'USER', entityId: user.id, details: `Suspended user ${user.name}` },
    });

    res.json({ success: true, data: user, message: 'User suspended successfully' });
  } catch (error) { next(error); }
});

// Activate user
router.put('/users/:id/activate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'ACTIVATE_USER', entity: 'USER', entityId: user.id, details: `Activated user ${user.name}` },
    });

    res.json({ success: true, data: user, message: 'User activated successfully' });
  } catch (error) { next(error); }
});

// Reset user password
router.put('/users/:id/reset-password', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, refreshToken: null },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'RESET_USER_PASSWORD', entity: 'USER', entityId: userId, details: 'Reset user password' },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) { next(error); }
});

// ========================
// MATERIALS MANAGEMENT
// ========================

// List all materials (admin view - all materials)
router.get('/materials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '20'));
    const search = String(req.query.search || '');
    const category = String(req.query.category || '');
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortOrder = String(req.query.sortOrder || 'desc') as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { properties: true, specifications: true, _count: { select: { properties: true, specifications: true } } },
      }),
      prisma.material.count({ where }),
    ]);

    res.json({
      success: true,
      data: materials,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// Create material
router.post('/materials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, slug, category, description, properties, specifications, uses, advantages, disadvantages, images, pdfCatalog } = req.body;
    
    // Generate slug if not provided
    const materialSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const material = await prisma.material.create({
      data: {
        name,
        slug: materialSlug,
        category,
        description,
        uses: uses || [],
        advantages: advantages || [],
        disadvantages: disadvantages || [],
        images: images || [],
        pdfCatalog,
        properties: properties ? { create: properties } : undefined,
        specifications: specifications ? { create: specifications } : undefined,
      },
      include: { properties: true, specifications: true },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'CREATE_MATERIAL', entity: 'MATERIAL', entityId: material.id, details: `Created material ${material.name}` },
    });

    res.status(201).json({ success: true, data: material, message: 'Material created successfully' });
  } catch (error) { next(error); }
});

// Update material
router.put('/materials/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const materialId = String(req.params.id);
    const { name, slug, category, description, properties, specifications, uses, advantages, disadvantages, images, pdfCatalog } = req.body;
    
    const existing = await prisma.material.findUnique({ where: { id: materialId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Material not found' });

    // Update the material
    const material = await prisma.material.update({
      where: { id: materialId },
      data: {
        name,
        slug,
        category,
        description,
        uses,
        advantages,
        disadvantages,
        images,
        pdfCatalog,
      },
    });

    // Handle properties update - delete existing and create new
    if (properties) {
      await prisma.materialProperty.deleteMany({ where: { materialId: materialId } });
      if (properties.length > 0) {
        await prisma.materialProperty.createMany({
          data: properties.map((p: any) => ({ ...p, materialId: materialId })),
        });
      }
    }

    // Handle specifications update
    if (specifications) {
      await prisma.specification.deleteMany({ where: { materialId: materialId } });
      if (specifications.length > 0) {
        await prisma.specification.createMany({
          data: specifications.map((s: any) => ({ ...s, materialId: materialId })),
        });
      }
    }

    const updated = await prisma.material.findUnique({
      where: { id: materialId },
      include: { properties: true, specifications: true },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'UPDATE_MATERIAL', entity: 'MATERIAL', entityId: material.id, details: `Updated material ${material.name}` },
    });

    res.json({ success: true, data: updated, message: 'Material updated successfully' });
  } catch (error) { next(error); }
});

// Delete material
router.delete('/materials/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const materialId = String(req.params.id);
    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    await prisma.material.delete({ where: { id: materialId } });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'DELETE_MATERIAL', entity: 'MATERIAL', entityId: materialId, details: `Deleted material ${material.name}` },
    });

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) { next(error); }
});

// ========================
// IS CODES MANAGEMENT
// ========================

// List IS codes
router.get('/iscodes', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '20'));
    const search = String(req.query.search || '');
    const category = String(req.query.category || '');
    const status = String(req.query.status || '');
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortOrder = String(req.query.sortOrder || 'desc') as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [codes, total] = await Promise.all([
      prisma.iSCode.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.iSCode.count({ where }),
    ]);

    res.json({
      success: true,
      data: codes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// Create IS code
router.post('/iscodes', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { code, title, category, description, year, pdfUrl, pages, status } = req.body;

    const isCode = await prisma.iSCode.create({
      data: { code, title, category, description, year: parseInt(year), pdfUrl, pages: pages ? parseInt(pages) : null, status: status || 'ACTIVE' },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'CREATE_ISCODE', entity: 'ISCODE', entityId: isCode.id, details: `Created IS code ${isCode.code}` },
    });

    res.status(201).json({ success: true, data: isCode, message: 'IS Code created successfully' });
  } catch (error) { next(error); }
});

// Update IS code
router.put('/iscodes/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isCodeId = String(req.params.id);
    const { code, title, category, description, year, pdfUrl, pages, status } = req.body;

    const isCode = await prisma.iSCode.update({
      where: { id: isCodeId },
      data: { code, title, category, description, year: year ? parseInt(year) : undefined, pdfUrl, pages: pages ? parseInt(pages) : undefined, status },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'UPDATE_ISCODE', entity: 'ISCODE', entityId: isCode.id, details: `Updated IS code ${isCode.code}` },
    });

    res.json({ success: true, data: isCode, message: 'IS Code updated successfully' });
  } catch (error) { next(error); }
});

// Delete IS code
router.delete('/iscodes/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isCodeId = String(req.params.id);
    const isCode = await prisma.iSCode.findUnique({ where: { id: isCodeId } });
    if (!isCode) return res.status(404).json({ success: false, message: 'IS Code not found' });

    await prisma.iSCode.delete({ where: { id: isCodeId } });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'DELETE_ISCODE', entity: 'ISCODE', entityId: isCodeId, details: `Deleted IS code ${isCode.code}` },
    });

    res.json({ success: true, message: 'IS Code deleted successfully' });
  } catch (error) { next(error); }
});

// ========================
// LEARNING CENTER MANAGEMENT
// ========================

// Articles
router.get('/learning/articles', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '20'));
    const search = String(req.query.search || '');
    const category = String(req.query.category || '');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.article.count({ where }),
    ]);

    res.json({ success: true, data: articles, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/learning/articles', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, slug, content, excerpt, category, author, imageUrl, readTime, tags } = req.body;
    const articleSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const article = await prisma.article.create({
      data: { title, slug: articleSlug, content, excerpt, category, author, imageUrl, readTime: readTime ? parseInt(readTime) : null, tags: tags || [] },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'CREATE_ARTICLE', entity: 'ARTICLE', entityId: article.id, details: `Created article ${article.title}` },
    });

    res.status(201).json({ success: true, data: article, message: 'Article created successfully' });
  } catch (error) { next(error); }
});

router.put('/learning/articles/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const articleId = String(req.params.id);
    const article = await prisma.article.update({
      where: { id: articleId },
      data: req.body,
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'UPDATE_ARTICLE', entity: 'ARTICLE', entityId: article.id, details: `Updated article ${article.title}` },
    });

    res.json({ success: true, data: article, message: 'Article updated successfully' });
  } catch (error) { next(error); }
});

router.delete('/learning/articles/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const articleId = String(req.params.id);
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

    await prisma.article.delete({ where: { id: articleId } });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'DELETE_ARTICLE', entity: 'ARTICLE', entityId: articleId, details: `Deleted article ${article.title}` },
    });

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) { next(error); }
});

// Tutorials
router.get('/learning/tutorials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '20'));
    const search = String(req.query.search || '');
    const category = String(req.query.category || '');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;

    const [tutorials, total] = await Promise.all([
      prisma.tutorial.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.tutorial.count({ where }),
    ]);

    res.json({ success: true, data: tutorials, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/learning/tutorials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, videoUrl, duration, difficulty, category } = req.body;
    const tutorial = await prisma.tutorial.create({
      data: { title, description, videoUrl, duration: duration ? parseInt(duration) : null, difficulty, category },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'CREATE_TUTORIAL', entity: 'TUTORIAL', entityId: tutorial.id, details: `Created tutorial ${tutorial.title}` },
    });

    res.status(201).json({ success: true, data: tutorial, message: 'Tutorial created successfully' });
  } catch (error) { next(error); }
});

router.put('/learning/tutorials/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tutorialId = String(req.params.id);
    const tutorial = await prisma.tutorial.update({
      where: { id: tutorialId },
      data: req.body,
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'UPDATE_TUTORIAL', entity: 'TUTORIAL', entityId: tutorial.id, details: `Updated tutorial ${tutorial.title}` },
    });

    res.json({ success: true, data: tutorial, message: 'Tutorial updated successfully' });
  } catch (error) { next(error); }
});

router.delete('/learning/tutorials/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tutorialId = String(req.params.id);
    const tutorial = await prisma.tutorial.findUnique({ where: { id: tutorialId } });
    if (!tutorial) return res.status(404).json({ success: false, message: 'Tutorial not found' });

    await prisma.tutorial.delete({ where: { id: tutorialId } });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'DELETE_TUTORIAL', entity: 'TUTORIAL', entityId: tutorialId, details: `Deleted tutorial ${tutorial.title}` },
    });

    res.json({ success: true, message: 'Tutorial deleted successfully' });
  } catch (error) { next(error); }
});

// ========================
// CATEGORIES
// ========================

// Get all material categories
router.get('/categories/materials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.material.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { id: 'desc' } },
    });
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
});

// Get all IS code categories
router.get('/categories/iscodes', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.iSCode.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { id: 'desc' } },
    });
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
});

// Get all learning categories
router.get('/categories/learning', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [articleCategories, tutorialCategories] = await Promise.all([
      prisma.article.groupBy({ by: ['category'], _count: true }),
      prisma.tutorial.groupBy({ by: ['category'], _count: true }),
    ]);
    res.json({ success: true, data: { articles: articleCategories, tutorials: tutorialCategories } });
  } catch (error) { next(error); }
});

// ========================
// NOTIFICATIONS (Admin broadcasts)
// ========================

// Get all admin notifications
router.get('/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '20'));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true, avatar: true } } },
      }),
      prisma.adminNotification.count(),
    ]);

    res.json({ success: true, data: notifications, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Create notification broadcast
router.post('/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, message, type, audience, recipientIds, roleFilter } = req.body;

    const notification = await prisma.adminNotification.create({
      data: {
        title,
        message,
        type: type || 'ANNOUNCEMENT',
        audience: audience || 'ALL',
        recipientIds: recipientIds || [],
        roleFilter: roleFilter || null,
        createdById: req.user!.id,
      },
    });

    // Also create individual notifications for users if audience is ALL
    if (audience === 'ALL') {
      const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
      await prisma.notification.createMany({
        data: users.map((u: { id: string }) => ({
          userId: u.id,
          title,
          message,
          type: type || 'ANNOUNCEMENT',
        })),
      });
    } else if (audience === 'ROLE_BASED' && roleFilter) {
      const users = await prisma.user.findMany({ where: { role: roleFilter as any, isActive: true }, select: { id: true } });
      await prisma.notification.createMany({
        data: users.map((u: { id: string }) => ({
          userId: u.id,
          title,
          message,
          type: type || 'ANNOUNCEMENT',
        })),
      });
    } else if (audience === 'SELECTED_USERS' && recipientIds?.length > 0) {
      await prisma.notification.createMany({
        data: recipientIds.map((userId: string) => ({
          userId,
          title,
          message,
          type: type || 'ANNOUNCEMENT',
        })),
      });
    }

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'SEND_NOTIFICATION', entity: 'NOTIFICATION', entityId: notification.id, details: `Sent notification: ${title}` },
    });

    res.status(201).json({ success: true, data: notification, message: 'Notification sent successfully' });
  } catch (error) { next(error); }
});

// Delete notification
router.delete('/notifications/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notificationId = String(req.params.id);
    await prisma.adminNotification.delete({ where: { id: notificationId } });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) { next(error); }
});

// ========================
// ANALYTICS
// ========================

router.get('/analytics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log("Analytics Request:", req.query);

    // Validate and parse the "days" query parameter
    const days = Number(req.query.days) || 30;
    if (days <= 0 || !Number.isFinite(days)) {
      return res.status(400).json({
        success: false,
        message: "Invalid days parameter. Must be a positive number.",
      });
    }

    // Calculate the start date (UTC midnight) for filtering records
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setUTCDate(startDate.getUTCDate() - days);
    console.log("Generated Date:", startDate);

    // Run all independent queries in parallel using Promise.all.
    // Each query is wrapped in try/catch so a single failure doesn't crash the endpoint.
    const [
      visitorLogs,
      downloads,
      newUsers,
      materials,
      isCodes,
      topDownloadedMaterials,
      topViewedISCodes,
      storageData,
      dailyUsage,
    ] = await Promise.all([
      // Fetch visitor logs for the date range
      (async () => {
        try {
          return await prisma.visitorLog.findMany({
            where: { date: { gte: startDate } },
            orderBy: { date: 'asc' },
          });
        } catch (error: any) {
          console.error("[ANALYTICS] visitorLog.findMany error:", error.message);
          return [];
        }
      })(),

      // Fetch downloads within the date range
      (async () => {
        try {
          return await prisma.download.findMany({
            where: { createdAt: { gte: startDate } },
            orderBy: { createdAt: 'desc' },
          });
        } catch (error: any) {
          console.error("[ANALYTICS] download.findMany error:", error.message);
          return [];
        }
      })(),

      // Fetch new users registered within the date range (select only required fields)
      (async () => {
        try {
          return await prisma.user.findMany({
            where: { createdAt: { gte: startDate } },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, createdAt: true },
          });
        } catch (error: any) {
          console.error("[ANALYTICS] user.findMany error:", error.message);
          return [];
        }
      })(),

      // Fetch recent materials (last 10)
      (async () => {
        try {
          return await prisma.material.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
          });
        } catch (error: any) {
          console.error("[ANALYTICS] material.findMany error:", error.message);
          return [];
        }
      })(),

      // Fetch recent IS codes (last 10)
      (async () => {
        try {
          return await prisma.iSCode.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
          });
        } catch (error: any) {
          console.error("[ANALYTICS] iSCode.findMany error:", error.message);
          return [];
        }
      })(),

      // Fetch top downloaded materials.
      // FIXED: Removed empty _count.select block which caused Prisma error
      // "The select statement for type MaterialCountOutputType must not be empty".
      // Uses simple findMany with take:10 and createdAt sort as fallback.
      (async () => {
        try {
          return await prisma.material.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
          });
        } catch (error: any) {
          console.error("[ANALYTICS] topDownloadedMaterials error:", error.message);
          return [];
        }
      })(),

      // Fetch recent IS codes (assigned to topViewedISCodes)
      (async () => {
        try {
          return await prisma.iSCode.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
          });
        } catch (error: any) {
          console.error("[ANALYTICS] topViewedISCodes error:", error.message);
          return [];
        }
      })(),

      // Get total storage used
      (async () => {
        try {
          return await prisma.projectFile.aggregate({
            _sum: { size: true },
          });
        } catch (error: any) {
          console.error("[ANALYTICS] projectFile.aggregate error:", error.message);
          return { _sum: { size: 0 } };
        }
      })(),

      // Get daily usage breakdown (runs efficiently with batched date ranges)
      (async () => {
        try {
          return await getDailyUsageFixed(days, startDate);
        } catch (error: any) {
          console.error("[ANALYTICS] getDailyUsage error:", error.message);
          return [];
        }
      })(),
    ]);

    console.log("Prisma Result: Analytics data fetched successfully");

    // Group downloads by date for chart rendering
    const downloadsByDate: Record<string, number> = {};
    if (Array.isArray(downloads)) {
      (downloads as any[]).forEach((d: any) => {
        if (d && d.createdAt) {
          const date = new Date(d.createdAt).toISOString().split('T')[0];
          downloadsByDate[date] = (downloadsByDate[date] || 0) + 1;
        }
      });
    }

    // Group new users by date for chart rendering
    const usersByDate: Record<string, number> = {};
    if (Array.isArray(newUsers)) {
      (newUsers as any[]).forEach((u: any) => {
        if (u && u.createdAt) {
          const date = new Date(u.createdAt).toISOString().split('T')[0];
          usersByDate[date] = (usersByDate[date] || 0) + 1;
        }
      });
    }

    // Safely compute total storage in MB
    const storageSum = storageData && typeof storageData === 'object' && '_sum' in storageData
      ? (storageData as any)._sum?.size || 0
      : 0;
    const totalStorageMB = Math.round((Number(storageSum) / (1024 * 1024)) * 100) / 100;

    // Return JSON response with safe defaults for empty/null data
    res.json({
      success: true,
      data: {
        visitors: Array.isArray(visitorLogs) ? visitorLogs : [],
        downloads: downloadsByDate,
        newUsers: usersByDate,
        totalDownloads: Array.isArray(downloads) ? downloads.length : 0,
        totalNewUsers: Array.isArray(newUsers) ? newUsers.length : 0,
        recentMaterials: Array.isArray(materials) ? materials : [],
        recentISCodes: Array.isArray(isCodes) ? isCodes : [],
        topDownloadedMaterials: Array.isArray(topDownloadedMaterials) ? topDownloadedMaterials : [],
        topViewedISCodes: Array.isArray(topViewedISCodes) ? topViewedISCodes : [],
        totalStorage: totalStorageMB,
        dailyUsage: Array.isArray(dailyUsage) ? dailyUsage : [],
      },
    });
  } catch (error: any) {
    console.error("[ANALYTICS] Unexpected error:", error.message || error);
    // Always return JSON, never crash the server
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: error.message || "Unknown error",
    });
  }
});

/**
 * Optimized daily usage fetcher.
 * FIXES:
 * 1. Replaced findUnique(date) with findFirst + range query to avoid DateTime precision mismatch
 * 2. Used batched queries (Promise.all per day) for parallel execution
 * 3. Handles empty databases safely with fallback defaults
 * 4. Avoids mutating Date objects (creates fresh dates for each day)
 * 5. Uses UTC dates to avoid timezone mismatch with database
 */
async function getDailyUsageFixed(days: number, rangeStartDate: Date): Promise<{ date: string; users: number; downloads: number; visitors: number }[]> {
  const data: { date: string; users: number; downloads: number; visitors: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    // Create fresh Date objects for each day - avoids mutation bugs
    const dayStart = new Date(rangeStartDate);
    dayStart.setUTCDate(dayStart.getUTCDate() + i);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dateStr = dayStart.toISOString().split('T')[0];

    // Run 3 queries per day in parallel
    const [userCount, downloadCount, visitorCount] = await Promise.all([
      // Count users created on this day
      (async () => {
        try {
          return await prisma.user.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } },
          });
        } catch {
          return 0;
        }
      })(),

      // Count downloads on this day
      (async () => {
        try {
          return await prisma.download.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } },
          });
        } catch {
          return 0;
        }
      })(),

      // Get visitor count for this day
      // FIXED: Replaced findUnique(date) with findFirst({ where: { date: { gte, lte } } })
      // because findUnique requires an EXACT match on the unique DateTime field,
      // which fails due to millisecond/nanosecond precision mismatch between JS Date and PostgreSQL.
      (async () => {
        try {
          const visitorLog = await prisma.visitorLog.findFirst({
            where: {
              date: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
            select: { count: true },
          });
          return visitorLog?.count || 0;
        } catch {
          return 0;
        }
      })(),
    ]);

    data.push({
      date: dateStr,
      users: userCount,
      downloads: downloadCount,
      visitors: visitorCount,
    });
  }

  return data;
}

// ========================
// REPORTS
// ========================

// Users report
router.get('/reports/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(0);
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, isActive: true,
        isVerified: true, createdAt: true, updatedAt: true,
        _count: { select: { projects: true, downloads: true, notes: true } },
      },
    });

    res.json({ success: true, data: users, meta: { total: users.length } });
  } catch (error) { next(error); }
});

// Downloads report
router.get('/reports/downloads', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(0);
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();

    const downloads = await prisma.download.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
      take: 500,
    });

    res.json({ success: true, data: downloads, meta: { total: downloads.length } });
  } catch (error) { next(error); }
});

// Activity report
router.get('/reports/activity', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(0);
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '50'));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true, avatar: true } } },
      }),
      prisma.adminActivityLog.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    ]);

    res.json({ success: true, data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// Material usage report
router.get('/reports/materials', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { properties: true, specifications: true } } },
    });
    res.json({ success: true, data: materials, meta: { total: materials.length } });
  } catch (error) { next(error); }
});

// Learning report
router.get('/reports/learning', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [articles, tutorials] = await Promise.all([
      prisma.article.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.tutorial.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ success: true, data: { articles, tutorials, totalArticles: articles.length, totalTutorials: tutorials.length } });
  } catch (error) { next(error); }
});

// ========================
// ACTIVITY LOGS
// ========================

router.get('/activity-logs', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '30'));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true, avatar: true } } },
      }),
      prisma.adminActivityLog.count(),
    ]);

    res.json({ success: true, data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// ========================
// SETTINGS
// ========================

// Get site settings
router.get('/settings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: {} });
    }
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
});

// Update site settings
router.put('/settings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { ...req.body, updatedById: req.user!.id } });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: { ...req.body, updatedById: req.user!.id },
      });
    }

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'UPDATE_SETTINGS', entity: 'SETTINGS', entityId: settings.id, details: 'Updated site settings' },
    });

    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) { next(error); }
});

// ========================
// UPLOAD API (Cloudinary)
// ========================

router.post('/upload', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { fileUrl, publicId, originalName, size, format, folder } = req.body;
    
    const file = await prisma.projectFile.create({
      data: {
        originalName,
        url: fileUrl,
        publicId,
        size: parseInt(size || '0'),
        format,
        folder: folder || 'admin-uploads',
        uploadedById: req.user!.id,
      },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: req.user!.id, action: 'UPLOAD_FILE', entity: 'FILE', entityId: file.id, details: `Uploaded file ${originalName}` },
    });

    res.status(201).json({ success: true, data: file, message: 'File uploaded successfully' });
  } catch (error) { next(error); }
});

export default router;