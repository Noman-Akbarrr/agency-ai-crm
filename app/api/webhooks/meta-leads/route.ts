import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hubMode = searchParams.get("hub.mode")
  const hubToken = searchParams.get("hub.verify_token")
  const hubChallenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.META_VERIFY_TOKEN ?? "crm_verify_token"

  if (hubMode === "subscribe" && hubToken === verifyToken) {
    return new NextResponse(hubChallenge ?? "", { status: 200 })
  }

  return NextResponse.json({ success: false, error: "Verification failed" }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma()
  try {
    const body = await request.json()
    const { entry } = body

    if (!entry || !Array.isArray(entry)) {
      return NextResponse.json({ success: false, error: "Invalid Meta webhook payload" }, { status: 400 })
    }

    const leads: Array<{
      id: string
      ad_id: string
      form_id: string
      created_time: string
      field_data: Array<{ name: string; values: string[] }>
    }> = []

    for (const e of entry) {
      const changes = e.changes ?? []
      for (const change of changes) {
        if (change.field === "leadgen" && change.value?.leadgen_id) {
          // In a real implementation, fetch the lead from Meta Graph API using leadgen_id
          // For now, we'll store a placeholder
          leads.push({
            id: change.value.leadgen_id,
            ad_id: change.value.ad_id ?? "",
            form_id: change.value.form_id ?? "",
            created_time: new Date().toISOString(),
            field_data: [],
          })
        }
      }
    }

    // Ingest leads into CRM
    for (const lead of leads) {
      // Parse field_data into contact fields
      const firstName = lead.field_data.find((f) => f.name.toLowerCase().includes("first name"))?.values?.[0] ?? ""
      const lastName = lead.field_data.find((f) => f.name.toLowerCase().includes("last name"))?.values?.[0] ?? ""
      const email = lead.field_data.find((f) => f.name.toLowerCase().includes("email"))?.values?.[0] ?? ""
      const phone = lead.field_data.find((f) => f.name.toLowerCase().includes("phone"))?.values?.[0] ?? null

      if (!email) continue

      // Deduplicate
      const existing = await prisma.contact.findUnique({ where: { email } })
      if (existing) continue

      // Create company + contact
      await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: "Meta Lead",
            source: "META_ADS",
            stage: "NEW_SCRAPE",
          },
        })

        await tx.contact.create({
          data: {
            companyId: company.id,
            firstName: firstName || null,
            lastName: lastName || null,
            email,
            phone,
            verificationStatus: "UNVERIFIED",
            isSuppressed: false,
          },
        })

        await tx.activityLog.create({
          data: {
            actor: "SYSTEM_CODE",
            entityType: "Contact",
            entityId: company.id,
            action: "META_LEAD_INGESTED",
            metadata: { leadId: lead.id, adId: lead.ad_id },
          },
        })
      })
    }

    return NextResponse.json({ success: true, data: { ingested: leads.length } })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Meta webhook failed" },
      { status: 500 }
    )
  }
}