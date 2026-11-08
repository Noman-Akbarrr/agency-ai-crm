import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const items = await prisma.outreachMessage.findMany({
      where: {
        status: "DRAFT",
      },
      include: {
        contact: {
          include: { company: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    })

    const drafts = items.map((m) => ({
      id: m.id,
      contactEmail: m.contact.email,
      contactName: `${m.contact.firstName ?? ""} ${m.contact.lastName ?? ""}`.trim(),
      companyName: m.contact.company.name,
      subject: m.subject,
      bodyHtml: m.bodyHtml,
      bodyText: m.bodyText,
      status: m.status,
      sequenceStep: m.sequenceStep,
      aiPersonalizationHook: m.contact.aiPersonalizationHook,
    }))

    return NextResponse.json({ success: true, data: drafts })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch drafts" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing id or status" }, { status: 400 })
    }

    await prisma.outreachMessage.update({
      where: { id },
      data: { status: status as any },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update draft" },
      { status: 500 }
    )
  }
}