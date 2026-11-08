import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Auth: x-agent-api-key header
  const apiKey = request.headers.get("x-agent-api-key")
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().split("T")[0]

    // Reset daily quota if new day
    const config = await prisma.systemConfig.findUnique({ where: { id: "default" } })
    if (!config) {
      return NextResponse.json({ success: false, error: "System config not found" }, { status: 500 })
    }

    let emailsSentToday = config.emailsSentToday
    if (config.lastQuotaResetDate !== today) {
      await prisma.systemConfig.update({
        where: { id: "default" },
        data: { emailsSentToday: 0, lastQuotaResetDate: today },
      })
      emailsSentToday = 0
    }

    const pipelineCounts = await prisma.contact.groupBy({
      by: ["verificationStatus"],
      _count: { verificationStatus: true },
    })

    const localMxPassedCount = await prisma.contact.count({
      where: { verificationStatus: "LOCAL_MX_PASSED", isSuppressed: false },
    })

    const validCount = await prisma.contact.count({
      where: { verificationStatus: "VALID", isSuppressed: false },
    })

    const remainingQuota = Math.max(0, config.dailySendLimit - emailsSentToday)

    return NextResponse.json({
      success: true,
      data: {
        pipelineCounts,
        localMxPassedAwaitingZeroBounce: localMxPassedCount,
        validReadyForAiCopy: validCount,
        dailySendLimit: config.dailySendLimit,
        emailsSentToday,
        remainingDailySendQuota: remainingQuota,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to get context summary" },
      { status: 500 }
    )
  }
}