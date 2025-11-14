import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

let prismaClient: PrismaClient | null = null;

if (hasDatabaseUrl) {
  prismaClient =
    global.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
}

if (hasDatabaseUrl && prismaClient && process.env.NODE_ENV !== "production") {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
