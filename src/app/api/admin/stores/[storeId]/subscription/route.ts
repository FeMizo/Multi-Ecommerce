import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  planId: z.string(),
  status: z.enum(["ACTIVE", "PAST_DUE", "CANCELLED", "TRIALING"]).optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") return null
  return session
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { storeId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos" }, { status: 400 })

  const sub = await db.storeSubscription.upsert({
    where: { storeId },
    update: { planId: parsed.data.planId, status: parsed.data.status ?? "ACTIVE" },
    create: { storeId, planId: parsed.data.planId, status: parsed.data.status ?? "ACTIVE" },
  })

  return NextResponse.json(sub)
}
