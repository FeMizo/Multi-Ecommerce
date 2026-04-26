import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { CityManager } from "@/components/admin/city-manager"

export default async function AdminCitiesPage() {
  await requireAdmin()

  const cities = await db.city.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { stores: true } },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ciudades</h1>
      <CityManager cities={cities} />
    </div>
  )
}
