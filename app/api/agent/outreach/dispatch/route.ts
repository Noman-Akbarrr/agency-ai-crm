import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const prisma = await getPrisma()
  const resend = new Resend(process.env.RESEND_API_KEY)
  // Auth: x-agent-api-key header
  const apiKey = request.headers.get("x-agent-api-key")
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { contactId, sequenceStep = 1 } = body

    if (!contactId) {
      return NextResponse.json({ success: false, error: "Missing contactId" }, { status: 400 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { company: true, outreachMessages: true },
    })

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 })
    }

    // Guardrail 1: Must be VALID and not suppressed
    if (contact.verificationStatus !== "VALID" || contact.isSuppressed) {
      return NextResponse.json(
        { success: false, error: "Contact is not VALID or is suppressed" },
        { status: 400 }
      )
    }

    // Guardrail 2: Daily send quota
    const today = new Date().toISOString().split("T")[0]
    const config = await prisma.systemConfig.findUnique({ where: { id: "default" } })
    if (!config) {
      return NextResponse.json({ success: false, error: "System config not found" }, { status: 500 })
    }

    if (config.lastQuotaResetDate !== today) {
      await prisma.systemConfig.update({
        where: { id: "default" },
        data: { emailsSentToday: 0, lastQuotaResetDate: today },
      })
    }

    if (config.emailsSentToday >= config.dailySendLimit) {
      return NextResponse.json(
        { success: false, error: "Daily send limit reached" },
        { status: 429 }
      )
    }

    // Get the outreach message to send
    const message = await prisma.outreachMessage.findFirst({
      where: { contactId, sequenceStep, status: { in: ["DRAFT", "QUEUED"] } },
    })

    if (!message) {
      return NextResponse.json(
        { success: false, error: "No DRAFT/QUEUED outreach message found for this step" },
        { status: 400 }
      )
    }

    // Guardrail 3: Timezone window 08:30 AM – 04:30 PM in prospect's timezone
    const tz = Intl.DateTimeFormat(undefined, { timeZone: contact.company.timezone }).resolvedOptions().timeZone
    const nowInTz = new Date().toLocaleString("en-US", { timeZone: tz })
    const nowDate = new Date(nowInTz)
    const hours = nowDate.getHours()
    const minutes = nowDate.getMinutes()

    const isOutsideWindow = hours < 8 || (hours === 8 && minutes < 30) || hours >= 16 || (hours === 16 && minutes > 30)
    if (isOutsideWindow) {
      return NextResponse.json(
        { success: false, error: "Outside sending window (08:30 AM – 04:30 PM prospect timezone)" },
        { status: 400 }
      )
    }

    // Jitter: 4-9 minutes delay
    const jitterMinutes = 4 + Math.floor(Math.random() * 6)
    const scheduledAt = new Date(Date.now() + jitterMinutes * 60 * 1000)

    // Guardrail 4: Threading & unsubscribe headers
    const step1 = contact.outreachMessages.find((m) => m.sequenceStep === 1)
    const internetMessageId = `<${Date.now()}.${contactId}@crm.local>`

    const headers: Record<string, string> = {}
    if (sequenceStep > 1 && step1?.internetMessageId) {
      headers["In-Reply-To"] = step1.internetMessageId
      headers["References"] = step1.internetMessageId
    }
    headers["List-Unsubscribe"] = `<${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/unsubscribe?c=${contactId}>`
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

    // Send via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${config.senderName} <${config.senderEmail}>`,
      to: [contact.email],
      subject: message.subject,
      html: message.bodyHtml,
      text: message.bodyText,
      headers,
    })

    if (emailError) {
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: { status: "FAILED", errorMessage: emailError.message },
      })
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 500 }
      )
    }

    // Update outreach message as sent
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        resendMessageId: emailData?.id ?? null,
        internetMessageId,
        parentMessageId: step1?.internetMessageId ?? null,
        scheduledAt,
      },
    })

    // Increment daily sent count
    await prisma.systemConfig.update({
      where: { id: "default" },
      data: { emailsSentToday: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: {
        messageId: emailData?.id,
        contactId,
        sequenceStep,
        scheduledAt,
        remainingDailySendQuota: config.dailySendLimit - config.emailsSentToday - 1,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Dispatch failed" },
      { status: 500 }
    )
  }
}