// Prisma Client singleton for the Next.js app.
//
// In dev, Next.js hot reloads the module graph but Prisma's client maintains a
// connection pool. Without this pattern, `prisma generate` fires on every save
// and opens 10+ connections. The global cache survives the reload.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
