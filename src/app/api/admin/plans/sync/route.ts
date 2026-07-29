import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLAN_CATALOG } from "@/lib/plan-catalog"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") return null
  return session
}

export async function POST() {
  if (!await requireAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const plans = await Promise.all(
    PLAN_CATALOG.map((plan) =>
      db.plan.upsert({
        where: { slug: plan.slug },
        update: {
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          maxProducts: plan.maxProducts,
          maxOrdersMonth: plan.maxOrdersMonth,
          commissionRate: plan.commissionRate,
          features: plan.features as Prisma.InputJsonValue,
          stripePriceId: plan.stripePriceId,
          isActive: true,
        },
        create: {
          name: plan.name,
          slug: plan.slug,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          maxProducts: plan.maxProducts,
          maxOrdersMonth: plan.maxOrdersMonth,
          commissionRate: plan.commissionRate,
          features: plan.features as Prisma.InputJsonValue,
          stripePriceId: plan.stripePriceId,
        },
      })
    )
  )

  return NextResponse.json({ ok: true, plans })
}
