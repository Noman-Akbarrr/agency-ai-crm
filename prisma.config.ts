import { defineConfig, env } from "@prisma/config"

// During Docker build, DATABASE_URL may not be available yet.
// Use a placeholder that won't crash prisma generate; the real URL
// is provided at runtime via the deployment environment.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder?sslmode=disable"

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
  schema: "./prisma/schema.prisma",
  migrations: {
    seed: "node ./prisma/seed.ts",
  },
})