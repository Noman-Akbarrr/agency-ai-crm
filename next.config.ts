import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pg",
    "@prisma/adapter-pg",
    "@prisma/client",
    "@prisma/engines",
    "@prisma/get-platform",
  ],
}

export default nextConfig
