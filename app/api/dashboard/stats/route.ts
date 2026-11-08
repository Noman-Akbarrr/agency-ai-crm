import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const prisma = await getPrisma()
  try {
    const [
      totalContacts,
      verifiedReady,
      localMxPassed,
      suppressed,
      contacted,
      replied,
      qualified,
      outreachToday,
      config,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({
        where: { verificationStatus: "VALID", isSuppressed: false },
      }),
      prisma.contact.count({
        where: { verificationStatus: "LOCAL_MX_PASSED", isSuppressed: false },
      }),
      prisma.contact.count({ where: { isSuppressed: true } }),
      prisma.company.count({
        where: { stage: { in: ["CONTACTED", "ENGAGED"] } },
      }),
      prisma.company.count({ where: { stage: "REPLIED" } }),
      prisma.company.count({ where: { stage: "QUALIFIED" } }),
      prisma.outreachMessage.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] },
        },
      }),
      prisma.systemConfig.findUnique({ where: { id: "default" } }),
    ])

    const dailyLimit = config?.dailySendLimit ?? 50
    const emailsSentToday = config?.emailsSentToday ?? 0

    return NextResponse.json({
      success: true,
      data: {
        totalContacts,
        verifiedReady,
        localMxPassed,
        suppressed,
        contacted,
        replied,
        qualified,
        outreachToday,
        dailyLimit,
        emailsSentToday,
        quotaRemaining: Math.max(0, dailyLimit - emailsSentToday),
        senderName: config?.senderName ?? "Founder",
        senderEmail: config?.senderEmail ?? "outreach@yourdomain.com",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
