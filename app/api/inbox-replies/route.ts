import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const prisma = await getPrisma()
  try {
    const replies = await prisma.inboxReply.findMany({
      include: {
        contact: true,
      },
      orderBy: { receivedAt: "desc" },
      take: 20,
    })

    const data = replies.map((r) => ({
      id: r.id,
      fromEmail: r.fromEmail,
      subject: r.subject,
      bodyText: r.bodyText,
      receivedAt: r.receivedAt,
      contactName: r.contact
        ? `${r.contact.firstName ?? ""} ${r.contact.lastName ?? ""}`.trim() || null
        : null,
    }))

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch replies" },
      { status: 500 }
    )
  }
}