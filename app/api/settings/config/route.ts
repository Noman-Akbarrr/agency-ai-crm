import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const prisma = await getPrisma()
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: "default" },
    })

    if (!config) {
      return NextResponse.json(
        { success: false, error: "System config not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: config })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to get config" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const prisma = await getPrisma()
  try {
    const body = await request.json()
    const { dailySendLimit, senderName, senderEmail } = body

    const config = await prisma.systemConfig.update({
      where: { id: "default" },
      data: {
        ...(dailySendLimit !== undefined && { dailySendLimit }),
        ...(senderName !== undefined && { senderName }),
        ...(senderEmail !== undefined && { senderEmail }),
      },
    })

    return NextResponse.json({ success: true, data: config })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update config" },
      { status: 500 }
    )
  }
}