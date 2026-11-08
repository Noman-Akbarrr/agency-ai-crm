import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const prisma = await getPrisma()
  try {
    const today = new Date().toISOString().split("T")[0]
    const messages = await prisma.outreachMessage.findMany({
      where: {
        createdAt: { gte: new Date(today) },
      },
    })

    const statuses = ["SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED", "BOUNCED"] as const
    const stats = statuses.map((status) => ({
      status,
      count: messages.filter((m) => m.status === status).length,
    }))

    return NextResponse.json({ success: true, data: stats })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch stats" },
      { status: 500 }
    )
  }
}