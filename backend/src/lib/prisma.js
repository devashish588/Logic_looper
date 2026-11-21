import { PrismaClient } from '@prisma/client';

// One shared client for the whole process. Creating a PrismaClient per route
// file opens a separate connection pool for each, which exhausts serverless
// Postgres (Neon) connection limits.
const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

export default prisma;
