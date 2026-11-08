import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const items = await prisma.outreachMessage.findMany({
      where: {
        status: { in: ["QUEUED", "SCHEDULED"] },
      },
      include: {
        contact: {
          include: { company: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    })

    const messages = items.map((m) => ({
      id: m.id,
      contactEmail: m.contact.email,
      contactName: `${m.contact.firstName ?? ""} ${m.contact.lastName ?? ""}`.trim(),
      companyName: m.contact.company.name,
      subject: m.subject,
      status: m.status,
      scheduledAt: m.scheduledAt,
      timezone: m.contact.company.timezone,
      sequenceStep: m.sequenceStep,
    }))

    return NextResponse.json({ success: true, data: messages })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch scheduled" },
      { status: 500 }
    )
  }
}