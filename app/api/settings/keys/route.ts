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

    return NextResponse.json({
      success: true,
      data: {
        zeroBounceApiKey: config.zeroBounceApiKey,
        resendApiKey: config.resendApiKey,
        agentApiKey: config.agentApiKey,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to get keys" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const prisma = await getPrisma()
  try {
    const body = await request.json()
    const { zeroBounceApiKey, resendApiKey } = body

    await prisma.systemConfig.update({
      where: { id: "default" },
      data: {
        ...(zeroBounceApiKey !== undefined && { zeroBounceApiKey }),
        ...(resendApiKey !== undefined && { resendApiKey }),
      },
    })

    const updated = await prisma.systemConfig.findUnique({
      where: { id: "default" },
    })

    return NextResponse.json({
      success: true,
      data: {
        zeroBounceApiKey: updated?.zeroBounceApiKey ?? null,
        resendApiKey: updated?.resendApiKey ?? null,
        agentApiKey: updated?.agentApiKey ?? null,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update keys" },
      { status: 500 }
    )
  }
}