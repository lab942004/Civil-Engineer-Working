import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthenticatedRequest } from '../types';

/**
 * Middleware that verifies the user has ADMIN or SUPER_ADMIN role
 */
export const adminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  
  next();
};

/**
 * Middleware that verifies SUPER_ADMIN only
 */
export const superAdminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied. Super Admin only.' });
  }
  
  next();
};