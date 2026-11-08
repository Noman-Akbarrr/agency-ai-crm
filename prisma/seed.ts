import { PrismaClient, VerificationStatus, PipelineStage, LeadSource, ActorType } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // System config with default send limits
  const systemConfig = await prisma.systemConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      dailySendLimit: 50,
      emailsSentToday: 0,
      lastQuotaResetDate: new Date().toISOString().split("T")[0],
      senderName: "Founder",
      senderEmail: "outreach@yourdomain.com",
    },
  })
  console.log(`✓ SystemConfig: ${systemConfig.id}`)

  // Example company
  const company = await prisma.company.create({
    data: {
      name: "Example Roofing Co",
      industry: "Roofing",
      website: "https://example-roofing.com",
      phone: "(555) 123-4567",
      address: "123 Main St",
      city: "Austin",
      state: "TX",
      timezone: "America/Chicago",
      source: LeadSource.DIRECTORY_SCRAPE,
      stage: PipelineStage.NEW_SCRAPE,
    },
  })
  console.log(`✓ Company: ${company.name}`)

  // Example contact
  const contact = await prisma.contact.create({
    data: {
      companyId: company.id,
      firstName: "John",
      lastName: "Doe",
      role: "Owner",
      email: "john@example-roofing.com",
      phone: "(555) 123-4567",
      verificationStatus: VerificationStatus.UNVERIFIED,
      mxRecordsFound: false,
      isSuppressed: false,
    },
  })
  console.log(`✓ Contact: ${contact.email}`)

  // Example activity log
  await prisma.activityLog.create({
    data: {
      actor: ActorType.SYSTEM_CODE,
      entityType: "Company",
      entityId: company.id,
      action: "SEED",
      metadata: { source: "prisma/seed.ts" },
    },
  })
  console.log("✓ ActivityLog: SEED")

  console.log("🎉 Seed complete")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })