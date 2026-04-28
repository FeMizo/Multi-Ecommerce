import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { PlanManager } from "@/components/admin/plan-manager"

export default async function AdminPlansPage() {
  await requireAdmin()

  const plans = await db.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Planes</h1>
      <PlanManager plans={plans} />
    </div>
  )
}
