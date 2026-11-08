import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case "email.delivered": {
        const { messageId } = data
        await prisma.outreachMessage.updateMany({
          where: { resendMessageId: messageId },
          data: { status: "DELIVERED" },
        })
        break
      }

      case "email.opened": {
        const { messageId } = data
        await prisma.outreachMessage.updateMany({
          where: { resendMessageId: messageId },
          data: { status: "OPENED" },
        })
        break
      }

      case "email.bounced": {
        const { messageId, bounceType } = data
        const message = await prisma.outreachMessage.findFirst({
          where: { resendMessageId: messageId },
          include: { contact: true },
        })

        if (message?.contact) {
          await prisma.contact.update({
            where: { id: message.contactId },
            data: { isSuppressed: true },
          })

          await prisma.outreachMessage.update({
            where: { id: message.id },
            data: { status: "BOUNCED", errorMessage: bounceType },
          })

          await prisma.company.update({
            where: { id: message.contact.companyId },
            data: { stage: "DISQUALIFIED" },
          })
        }
        break
      }

      case "email.complained": {
        const { messageId } = data
        const message = await prisma.outreachMessage.findFirst({
          where: { resendMessageId: messageId },
          include: { contact: true },
        })

        if (message?.contact) {
          await prisma.contact.update({
            where: { id: message.contactId },
            data: { isSuppressed: true },
          })

          await prisma.outreachMessage.update({
            where: { id: message.id },
            data: { status: "BOUNCED", errorMessage: "spam_complaint" },
          })
        }
        break
      }

      default:
        // Ignore unknown event types
        break
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 }
    )
  }
}