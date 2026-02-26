import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

// Always cache the instance to prevent connection pool exhaustion on hot reloads
globalForPrisma.prisma = prisma;
