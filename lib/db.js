"use strict";
// Prisma Client singleton for the Next.js app.
//
// In dev, Next.js hot reloads the module graph but Prisma's client maintains a
// connection pool. Without this pattern, `prisma generate` fires on every save
// and opens 10+ connections. The global cache survives the reload.
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
