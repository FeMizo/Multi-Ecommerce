import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { StoreToggles } from "@/components/admin/store-toggles"
import { StorePlanSelector } from "@/components/admin/store-plan-selector"
import { AdminSearch } from "@/components/admin/admin-search"

type SearchParams = { q?: string }

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const { q } = await searchParams

  const [stores, plans] = await Promise.all([
    db.store.findMany({
      where: {
        deletedAt: null,
        ...(q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { members: { some: { role: "OWNER", user: { OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ] } } } },
          ],
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { name: true } },
        subscription: { include: { plan: { select: { id: true, name: true } } } },
        members: {
          where: { role: "OWNER" },
          include: { user: { select: { name: true, email: true } } },
          take: 1,
        },
        _count: {
          select: {
            products: { where: { deletedAt: null } },
            orders: true,
          },
        },
      },
    }),
    db.plan.findMany({ where: { isActive: true }, select: { id: true, name: true, commissionRate: true }, orderBy: { priceMonthly: "asc" } }),
  ])

  const revenues = await db.order.groupBy({
    by: ["storeId"],
    where: { status: { in: ["PAID", "DELIVERED"] } },
    _sum: { total: true },
  })
  const revenueMap = new Map(revenues.map((r) => [r.storeId, r._sum.total ?? 0]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Tiendas</h1>
        <div className="flex items-center gap-3">
          <AdminSearch placeholder="Buscar tienda u owner..." />
          <p className="text-sm text-muted-foreground shrink-0">{stores.length} encontradas</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Tienda</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Dueño</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Ciudad</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Productos</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Pedidos</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Estado</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => {
                  const owner = store.members[0]?.user
                  return (
                    <tr key={store.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{store.name}</p>
                            <p className="text-xs text-muted-foreground">/{store.slug}</p>
                          </div>
                          {store.isVerified && (
                            <Badge variant="outline" className="text-blue-500 border-blue-200 text-xs">
                              Verificada
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {owner ? (
                          <div>
                            <p>{owner.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{owner.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{store.city?.name ?? "—"}</td>
                      <td className="p-4">
                        <StorePlanSelector
                          storeId={store.id}
                          plans={plans}
                          currentPlanId={store.subscription?.plan.id}
                        />
                      </td>
                      <td className="p-4 text-center">{store._count.products}</td>
                      <td className="p-4 text-center">{store._count.orders}</td>
                      <td className="p-4 text-right font-medium">
                        {formatPrice(revenueMap.get(store.id) ?? 0)}
                      </td>
                      <td className="p-4">
                        <StoreToggles
                          storeId={store.id}
                          isActive={store.isActive}
                          isVerified={store.isVerified}
                        />
                      </td>
                      <td className="p-4">
                        <Link href={`/dashboard/${store.slug}`} className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {stores.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
