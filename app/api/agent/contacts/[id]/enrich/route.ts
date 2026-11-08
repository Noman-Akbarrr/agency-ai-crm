import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth: x-agent-api-key header
  const apiKey = request.headers.get("x-agent-api-key")
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { aiResearchNotes, aiPersonalizationHook, sequenceStep, subject, bodyHtml, bodyText } = body

    const contact = await prisma.contact.findUnique({ where: { id } })
    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 })
    }

    if (contact.verificationStatus !== "VALID" || contact.isSuppressed) {
      return NextResponse.json(
        { success: false, error: "Contact is not VALID or is suppressed" },
        { status: 400 }
      )
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        aiPersonalizationHook: aiPersonalizationHook ?? null,
      },
    })

    // aiResearchNotes lives on Company, not Contact
    if (aiResearchNotes !== undefined) {
      await prisma.company.update({
        where: { id: contact.companyId },
        data: { aiResearchNotes },
      })
    }

    // Stage an OutreachMessage if copy provided
    let outreachMessage = null
    if (subject && bodyHtml) {
      const step = sequenceStep ?? 1
      outreachMessage = await prisma.outreachMessage.create({
        data: {
          contactId: id,
          sequenceStep: step,
          subject,
          bodyHtml,
          bodyText: bodyText ?? "",
          status: "DRAFT",
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: { contact: updated, outreachMessage },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to enrich contact" },
      { status: 500 }
    )
  }
}