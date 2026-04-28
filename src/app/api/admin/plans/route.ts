import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  commissionRate: z.number().min(0).max(1),
  maxProducts: z.number().int().positive().nullable().optional(),
  maxOrdersMonth: z.number().int().positive().nullable().optional(),
  stripePriceId: z.string().optional().or(z.literal("")),
  features: z.record(z.unknown()).optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  const plans = await db.plan.findMany({ orderBy: { priceMonthly: "asc" } })
  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 })

  const { features, stripePriceId, ...rest } = parsed.data
  const plan = await db.plan.create({
    data: {
      ...rest,
      features: features ?? {},
      stripePriceId: stripePriceId || null,
    },
  })

  return NextResponse.json(plan, { status: 201 })
}
