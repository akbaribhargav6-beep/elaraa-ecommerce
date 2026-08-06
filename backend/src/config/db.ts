import { PrismaClient } from '@prisma/client';
import { isProd } from './env';

// Singleton PrismaClient — avoids exhausting DB connections from tsx's
// hot-reload creating a fresh client on every file change in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn'],
  });

if (!isProd) {
  globalForPrisma.prisma = prisma;
}
