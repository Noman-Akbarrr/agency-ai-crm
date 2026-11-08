import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const prisma = await getPrisma()
  // Auth: x-agent-api-key header
  const apiKey = request.headers.get("x-agent-api-key")
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const task = searchParams.get("task") as "NEEDS_COPY" | "READY_TO_SEND" | null
  const industry = searchParams.get("industry")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100)

  if (!task || !["NEEDS_COPY", "READY_TO_SEND"].includes(task)) {
    return NextResponse.json(
      { success: false, error: 'Invalid task. Use "NEEDS_COPY" or "READY_TO_SEND"' },
      { status: 400 }
    )
  }

  try {
    const where: Record<string, unknown> = {
      verificationStatus: "VALID",
      isSuppressed: false,
    }

    if (industry) {
      where.company = { industry: { contains: industry, mode: "insensitive" } }
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: { company: true, outreachMessages: true },
      take: limit,
      orderBy: { createdAt: "asc" },
    })

    // Filter by task type
    let filtered = contacts
    if (task === "NEEDS_COPY") {
      // Has no outreach messages or all are DRAFT/QUEUED (needs AI copy)
      filtered = contacts.filter(
        (c) => !c.outreachMessages || c.outreachMessages.length === 0
      )
    } else if (task === "READY_TO_SEND") {
      // Has QUEUED or SCHEDULED outreach messages
      filtered = contacts.filter(
        (c) => c.outreachMessages.some((m) => m.status === "QUEUED" || m.status === "SCHEDULED")
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        task,
        count: filtered.length,
        contacts: filtered.map((c) => ({
          id: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          role: c.role,
          company: c.company,
          aiPersonalizationHook: c.aiPersonalizationHook,
        })),
        remainingDailySendQuota: 0, // Will be filled by context summary
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to get leads queue" },
      { status: 500 }
    )
  }
}