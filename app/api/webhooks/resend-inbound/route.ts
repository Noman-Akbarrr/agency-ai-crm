import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const OPTOUT_KEYWORDS = ["stop", "unsubscribe", "remove me", "opt out", "do not email"]

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, subject, text_body: textBody, message_id: messageId } = body

    if (!from) {
      return NextResponse.json({ success: false, error: "Missing 'from' field" }, { status: 400 })
    }

    // Match from email to Contact
    const contact = await prisma.contact.findFirst({
      where: { email: from },
      include: { company: true, outreachMessages: true },
    })

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found for email: " + from }, { status: 404 })
    }

    // Log the inbound reply
    await prisma.inboxReply.create({
      data: {
        contactId: contact.id,
        fromEmail: from,
        subject: subject ?? "",
        bodyText: textBody ?? "",
      },
    })

    // Update company stage to REPLIED
    await prisma.company.update({
      where: { id: contact.companyId },
      data: { stage: "REPLIED" },
    })

    // Cancel all queued follow-ups for this contact
    await prisma.outreachMessage.updateMany({
      where: {
        contactId: contact.id,
        status: { in: ["QUEUED", "SCHEDULED"] },
      },
      data: { status: "CANCELLED" },
    })

    // Auto-suppress if opt-out keywords detected
    const bodyTextLower = (textBody ?? "").toLowerCase()
    const hasOptOut = OPTOUT_KEYWORDS.some((kw) => bodyTextLower.includes(kw))

    if (hasOptOut) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { isSuppressed: true },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        contactId: contact.id,
        stage: "REPLIED",
        autoSuppressed: hasOptOut,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Inbound webhook failed" },
      { status: 500 }
    )
  }
}