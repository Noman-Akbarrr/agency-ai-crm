"use server"

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      }),
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    })
  }
  return prismaInstance
}