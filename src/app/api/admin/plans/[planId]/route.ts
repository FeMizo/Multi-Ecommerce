import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  priceMonthly: z.number().min(0).optional(),
  priceYearly: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  maxProducts: z.number().int().positive().nullable().optional(),
  maxOrdersMonth: z.number().int().positive().nullable().optional(),
  stripePriceId: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  features: z.record(z.unknown()).optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") return null
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { planId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos" }, { status: 400 })

  const { stripePriceId, ...rest } = parsed.data
  const plan = await db.plan.update({
    where: { id: planId },
    data: {
      ...rest,
      ...(stripePriceId !== undefined ? { stripePriceId: stripePriceId || null } : {}),
    },
  })

  return NextResponse.json(plan)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { planId } = await params
  const subs = await db.storeSubscription.count({ where: { planId } })
  if (subs > 0) return NextResponse.json({ message: "El plan tiene suscripciones activas" }, { status: 409 })

  await db.plan.delete({ where: { id: planId } })
  return NextResponse.json({ ok: true })
}
