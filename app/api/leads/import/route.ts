import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import {
  runLocalHygiene,
  getTimezoneForState,
  isValidEmailSyntax,
} from "@/lib/timezone-and-mx"
import { z } from "zod"

const importRowSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
  companyName: z.string(),
  industry: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.enum(["DIRECTORY_SCRAPE", "META_ADS", "MANUAL", "API"]).optional(),
})

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const prisma = await getPrisma()
  try {
    const body = await request.json()
    const rows = Array.isArray(body) ? body : [body]

    const results: Array<{
      email: string
      status: "imported" | "skipped" | "invalid"
      reason?: string
    }> = []

    const seenEmails = new Set<string>()
    const seenWebsites = new Set<string>()

    for (const rawRow of rows) {
      const parsed = importRowSchema.safeParse(rawRow)
      if (!parsed.success) {
        results.push({
          email: rawRow.email ?? "unknown",
          status: "invalid",
          reason: parsed.error.issues.map((e) => e.message).join(", "),
        })
        continue
      }

      const { email, website, state, ...rest } = parsed.data

      // Deduplicate by email and website
      if (seenEmails.has(email.toLowerCase())) {
        results.push({ email, status: "skipped", reason: "Duplicate email" })
        continue
      }
      if (website && seenWebsites.has(website.toLowerCase())) {
        results.push({ email, status: "skipped", reason: "Duplicate website" })
        continue
      }
      seenEmails.add(email.toLowerCase())
      if (website) seenWebsites.add(website.toLowerCase())

      // Check if contact already exists in DB
      const existingContact = await prisma.contact.findUnique({ where: { email } })
      if (existingContact) {
        results.push({ email, status: "skipped", reason: "Contact already exists" })
        continue
      }

      // Stage 1 local hygiene
      const hygiene = await runLocalHygiene(email)
      if (hygiene.status === "INVALID_SYNTAX" || hygiene.status === "ROLE_ACCOUNT") {
        results.push({
          email,
          status: "invalid",
          reason:
            hygiene.status === "ROLE_ACCOUNT" ? "Role account blocked" : "Invalid email syntax",
        })
        continue
      }

      // Determine verification status
      let verificationStatus = "UNVERIFIED"
      let mxRecordsFound = false
      let companyStage = "NEW_SCRAPE"

      if (!hygiene.mxRecordsFound) {
        verificationStatus = "INVALID"
        mxRecordsFound = false
        companyStage = "NEW_SCRAPE"
      } else {
        verificationStatus = "LOCAL_MX_PASSED"
        mxRecordsFound = true
        companyStage = "LOCAL_FILTERED"
      }

      // Create company + contact in a transaction
      const timezone = getTimezoneForState(state)

      try {
        await prisma.$transaction(async (tx) => {
          const company = await tx.company.create({
            data: {
              name: rest.companyName,
              industry: rest.industry ?? null,
              website: website || null,
              phone: rest.phone ?? null,
              address: rest.address ?? null,
              city: rest.city ?? null,
              state: state ?? null,
              timezone,
              source: (rest.source as any) ?? "DIRECTORY_SCRAPE",
              stage: companyStage as any,
            },
          })

          await tx.contact.create({
            data: {
              companyId: company.id,
              firstName: rest.firstName ?? null,
              lastName: rest.lastName ?? null,
              role: rest.role ?? null,
              email,
              phone: rest.phone ?? null,
              verificationStatus: verificationStatus as any,
              mxRecordsFound,
              isSuppressed: verificationStatus === "INVALID",
            },
          })
        })

        results.push({ email, status: "imported" })
      } catch (err) {
        results.push({
          email,
          status: "skipped",
          reason: err instanceof Error ? err.message : "Database error",
        })
      }
    }

    const imported = results.filter((r) => r.status === "imported").length
    const skipped = results.filter((r) => r.status === "skipped").length
    const invalid = results.filter((r) => r.status === "invalid").length

    return NextResponse.json({
      success: true,
      data: { results, imported, skipped, invalid, total: rows.length },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    )
  }
}