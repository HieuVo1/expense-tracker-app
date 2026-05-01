import { PrismaClient } from '@prisma/client';

// Hot-reload safe singleton — Next.js dev mode tears down modules on every change,
// which would otherwise spawn a new PrismaClient per HMR cycle and exhaust the pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
