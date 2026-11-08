import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma()
  try {
    const { id } = await params
    const body = await request.json()
    const { stage } = body

    if (!stage) {
      return NextResponse.json(
        { success: false, error: "Missing stage" },
        { status: 400 }
      )
    }

    const company = await prisma.company.update({
      where: { id },
      data: { stage: stage as any },
    })

    return NextResponse.json({ success: true, data: company })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update stage" },
      { status: 500 }
    )
  }
}