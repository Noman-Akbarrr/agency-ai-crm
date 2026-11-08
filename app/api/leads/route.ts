import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: { company: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    })

    const leads = contacts.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      companyName: c.company.name,
      companyId: c.companyId,
      role: c.role,
      stage: c.company.stage,
      verificationStatus: c.verificationStatus,
      mxRecordsFound: c.mxRecordsFound,
      isSuppressed: c.isSuppressed,
      timezone: c.company.timezone,
      aiPersonalizationHook: c.aiPersonalizationHook,
      createdAt: c.createdAt,
    }))

    return NextResponse.json({ success: true, data: leads })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch leads" },
      { status: 500 }
    )
  }
}