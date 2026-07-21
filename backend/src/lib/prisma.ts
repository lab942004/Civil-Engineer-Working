import { PrismaClient } from '@prisma/client';

// BUG FIX: The original code created a `new PrismaClient()` in every service
// file and in nearly every inline route handler in routes/index.ts. Each
// PrismaClient opens its own connection pool, so under real traffic this
// exhausted Postgres connections very quickly and made hot-reload in dev
// spawn dozens of orphaned clients. We use a single shared instance across
// the whole backend (guarded against hot-reload duplication) instead.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
