import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import type { AuthenticatedRequest } from '../types';

// SECURITY FIX (pre-publish): suspending a user (`/admin/users/:id/suspend`)
// only ever flipped `isActive` in the database — it never actually revoked
// that user's already-issued JWT. Since `authenticate` trusted the token's
// embedded role/identity with no DB check, a suspended (or since-deleted)
// user could keep making authenticated requests — including admin-panel
// requests if they were an admin — for up to the token's full 7-day
// lifetime. We now confirm the account is still active on every request.
// This costs one indexed lookup per request, which is an acceptable
// trade-off for suspension actually taking effect immediately.
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true, role: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is inactive or no longer exists.' });
    }

    // Use the DB's current role rather than the token's — if an admin was
    // demoted after the token was issued, the demotion should apply
    // immediately rather than waiting out the token's remaining lifetime.
    req.user = { ...decoded, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as { id: string; email: string; role: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { isActive: true, role: true } });
      if (user?.isActive) {
        req.user = { ...decoded, role: user.role };
      }
    } catch {
      // Token invalid, continue without user
    }
  }
  next();
};