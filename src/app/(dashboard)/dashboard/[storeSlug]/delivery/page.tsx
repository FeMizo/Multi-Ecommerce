import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Clock3, Package, Truck, Users } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEffectivePlan } from "@/lib/plan-limits"
import { getStoreAccess } from "@/lib/store-access"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeliveryAssignmentPanel } from "@/components/delivery/delivery-assignment-panel"

export default async function DeliveryDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getStoreAccess(session.user.id, storeSlug)
  if (!membership) redirect("/dashboard")
  if (!await getEffectivePlan(membership.store.id)) redirect(`/dashboard/${storeSlug}/planes?billing=required`)

  const [drivers, deliveries, totalOrders] = await Promise.all([
    db.driver.findMany({
      where: { OR: [{ storeId: membership.store.id }, { storeId: null }] },
      select: {
        id: true,
        name: true,
        phone: true,
        plate: true,
        licenseNumber: true,
        status: true,
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    db.delivery.findMany({
      where: {
        storeId: membership.store.id,
        method: "LOCAL_DELIVERY",
        status: { in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] },
      },
      select: {
        id: true,
        status: true,
        formattedAddress: true,
        lat: true,
        lng: true,
        notes: true,
        driverId: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            plate: true,
            licenseNumber: true,
            status: true,
          },
        },
        order: {
          select: {
            id: true,
            total: true,
            customerEmail: true,
            customer: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    db.order.count({ where: { storeId: membership.store.id } }),
  ])

  const availableDrivers = drivers.filter((driver) => driver.status === "AVAILABLE")
  const activeDeliveries = deliveries.filter((delivery) => delivery.status !== "PENDING")
  const pendingDeliveries = deliveries.filter((delivery) => delivery.status === "PENDING")

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Delivery</h1>
          <p className="text-sm text-muted-foreground">Vista operativa de pedidos y repartidores</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/${storeSlug}/delivery/drivers`}>
            Administrar repartidores
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregas activas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeDeliveries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repartidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{drivers.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{availableDrivers.length} disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos en curso</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeDeliveries.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entregas pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDeliveries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay entregas pendientes.</p>
            ) : (
              pendingDeliveries.map((delivery) => (
                <DeliveryAssignmentPanel key={delivery.id} storeSlug={storeSlug} delivery={delivery} drivers={drivers} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entregas activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDeliveries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin entregas en proceso.</p>
            ) : (
              activeDeliveries.map((delivery) => (
                <DeliveryAssignmentPanel key={delivery.id} storeSlug={storeSlug} delivery={delivery} drivers={drivers} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
