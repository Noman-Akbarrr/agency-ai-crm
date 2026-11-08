import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const zerobounceRequestSchema = z.object({
  contactIds: z.array(z.string()).min(1, "At least one contact ID required"),
})

import { z } from "zod"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = zerobounceRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 }
      )
    }

    const { contactIds } = parsed.data

    // Fetch contacts that are LOCAL_MX_PASSED and not suppressed
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        verificationStatus: "LOCAL_MX_PASSED",
        isSuppressed: false,
      },
      include: { company: true },
    })

    if (contacts.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No LOCAL_MX_PASSED contacts found for the provided IDs",
      })
    }

    const zeroBounceApiKey = process.env.ZEROBOUNCE_API_KEY
    if (!zeroBounceApiKey) {
      return NextResponse.json(
        { success: false, error: "ZeroBounce API key not configured" },
        { status: 500 }
      )
    }

    const results: Array<{
      contactId: string
      email: string
      status: "verified" | "suppressed" | "error"
      reason?: string
    }> = []

    for (const contact of contacts) {
      try {
        const response = await fetch(
          `https://api.zerobounce.net/v2/validate?api_key=${zeroBounceApiKey}&email=${encodeURIComponent(contact.email)}`
        )
        const data = await response.json()

        if (data.status === "valid") {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              verificationStatus: "VALID",
              verificationSubStatus: data.sub_status ?? null,
              verifiedAt: new Date(),
              isSuppressed: false,
            },
          })

          await prisma.company.update({
            where: { id: contact.companyId },
            data: { stage: "READY_FOR_OUTREACH" },
          })

          results.push({ contactId: contact.id, email: contact.email, status: "verified" })
        } else {
          // invalid, catch-all, spamtrap, abuse, etc.
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              verificationStatus: data.status as any,
              verificationSubStatus: data.sub_status ?? null,
              verifiedAt: new Date(),
              isSuppressed: true,
            },
          })

          await prisma.company.update({
            where: { id: contact.companyId },
            data: { stage: "DISQUALIFIED" },
          })

          results.push({
            contactId: contact.id,
            email: contact.email,
            status: "suppressed",
            reason: data.status,
          })
        }
      } catch (err) {
        results.push({
          contactId: contact.id,
          email: contact.email,
          status: "error",
          reason: err instanceof Error ? err.message : "ZeroBounce request failed",
        })
      }
    }

    const verified = results.filter((r) => r.status === "verified").length
    const suppressed = results.filter((r) => r.status === "suppressed").length

    return NextResponse.json({
      success: true,
      data: { results, verified, suppressed, total: contacts.length },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "ZeroBounce verification failed" },
      { status: 500 }
    )
  }
}