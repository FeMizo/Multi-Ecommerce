import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { nonnegativeMxnSchema } from "@/lib/money"
import { isMatchingMonthlyMxnPrice } from "@/lib/stripe-billing"

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  priceMonthly: nonnegativeMxnSchema.optional(),
  maxProducts: z.number().int().positive().nullable().optional(),
  maxOrdersMonth: z.number().int().positive().nullable().optional(),
  stripePriceId: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  features: z.record(z.string(), z.unknown()).optional(),
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

  const { stripePriceId, features, ...rest } = parsed.data
  const current = await db.plan.findUniqueOrThrow({ where: { id: planId } })
  const nextMonthly = rest.priceMonthly ?? current.priceMonthly
  const nextPriceId = stripePriceId === undefined ? current.stripePriceId : stripePriceId || null
  const nextActive = rest.isActive ?? current.isActive
  if (nextActive && nextMonthly > 0 && !nextPriceId) {
    return NextResponse.json({ message: "Un plan pagado activo requiere Stripe Price ID" }, { status: 409 })
  }
  if (nextPriceId && !await isMatchingMonthlyMxnPrice(nextPriceId, nextMonthly)) {
    return NextResponse.json({ message: "El Price debe ser mensual, recurrente, MXN y coincidir con el importe" }, { status: 409 })
  }
  const plan = await db.plan.update({
    where: { id: planId },
    data: {
      ...rest,
      ...(features !== undefined ? { features: features as Prisma.InputJsonValue } : {}),
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
