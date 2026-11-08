import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma()
  try {
    const { id } = await params
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { company: true, outreachMessages: true, inboxReplies: true },
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        role: contact.role,
        verificationStatus: contact.verificationStatus,
        verificationSubStatus: contact.verificationSubStatus,
        mxRecordsFound: contact.mxRecordsFound,
        isSuppressed: contact.isSuppressed,
        aiPersonalizationHook: contact.aiPersonalizationHook,
        company: {
          id: contact.company.id,
          name: contact.company.name,
          industry: contact.company.industry,
          state: contact.company.state,
          stage: contact.company.stage,
          timezone: contact.company.timezone,
        },
        outreachMessages: contact.outreachMessages.map((m) => ({
          id: m.id,
          sequenceStep: m.sequenceStep,
          subject: m.subject,
          bodyHtml: m.bodyHtml,
          bodyText: m.bodyText,
          status: m.status,
          scheduledAt: m.scheduledAt,
          sentAt: m.sentAt,
          internetMessageId: m.internetMessageId,
        })),
        inboxReplies: contact.inboxReplies.map((r) => ({
          id: r.id,
          fromEmail: r.fromEmail,
          subject: r.subject,
          bodyText: r.bodyText,
          receivedAt: r.receivedAt,
        })),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch contact" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma()
  try {
    const { id } = await params
    const body = await request.json()
    const { aiPersonalizationHook } = body

    const contact = await prisma.contact.update({
      where: { id },
      data: { aiPersonalizationHook },
    })

    return NextResponse.json({ success: true, data: contact })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update contact" },
      { status: 500 }
    )
  }
}