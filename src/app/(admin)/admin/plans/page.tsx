import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { PlanManager } from "@/components/admin/plan-manager"

export default async function AdminPlansPage() {
  await requireAdmin()

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Planes</h1>
      <PlanManager plans={plans} />
    </div>
  )
}
