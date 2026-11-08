import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contactId = searchParams.get("c")

  if (!contactId) {
    return NextResponse.json({ success: false, error: "Missing contact ID (c parameter)" }, { status: 400 })
  }

  try {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: { isSuppressed: true },
      include: { company: true },
    })

    // Cancel all queued outreach for this contact
    await prisma.outreachMessage.updateMany({
      where: {
        contactId,
        status: { in: ["DRAFT", "QUEUED", "SCHEDULED"] },
      },
      data: { status: "CANCELLED" },
    })

    // Render opt-out confirmation page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Unsubscribed</title></head>
        <body style="font-family: system-ui, sans-serif; text-align: center; padding: 4rem;">
          <h1>You've been unsubscribed</h1>
          <p>${contact.email} has been removed from our mailing list.</p>
          <p>You will no longer receive emails from us.</p>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unsubscribe failed" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactId } = body

    if (!contactId) {
      return NextResponse.json({ success: false, error: "Missing contactId" }, { status: 400 })
    }

    await prisma.contact.update({
      where: { id: contactId },
      data: { isSuppressed: true },
    })

    await prisma.outreachMessage.updateMany({
      where: {
        contactId,
        status: { in: ["DRAFT", "QUEUED", "SCHEDULED"] },
      },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ success: true, data: { contactId, isSuppressed: true } })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unsubscribe failed" },
      { status: 500 }
    )
  }
}