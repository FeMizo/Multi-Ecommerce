import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { nonnegativeMxnSchema } from "@/lib/money"
import { isMatchingMonthlyMxnPrice } from "@/lib/stripe-billing"

const schema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  priceMonthly: nonnegativeMxnSchema,
  commissionRate: z.number().finite().min(0).max(1).optional(),
  maxProducts: z.number().int().positive().nullable().optional(),
  maxOrdersMonth: z.number().int().positive().nullable().optional(),
  stripePriceId: z.string().optional().or(z.literal("")),
  features: z.record(z.string(), z.unknown()).optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  const plans = await db.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      priceMonthly: true,
      commissionRate: true,
      maxProducts: true,
      maxOrdersMonth: true,
      stripePriceId: true,
      isActive: true,
    },
  })
  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 })

  const { features, stripePriceId, ...rest } = parsed.data
  if (rest.priceMonthly > 0 && !stripePriceId) {
    return NextResponse.json({ message: "Un plan pagado activo requiere Stripe Price ID" }, { status: 409 })
  }
  if (stripePriceId && !await isMatchingMonthlyMxnPrice(stripePriceId, rest.priceMonthly)) {
    return NextResponse.json({ message: "El Price debe ser mensual, recurrente, MXN y coincidir con el importe" }, { status: 409 })
  }
  const plan = await db.plan.create({
    data: {
      ...rest,
      features: (features ?? {}) as Prisma.InputJsonValue,
      stripePriceId: stripePriceId || null,
    },
  })

  return NextResponse.json(plan, { status: 201 })
}
