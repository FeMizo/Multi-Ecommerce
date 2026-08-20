import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent } from "@/components/ui/card"
import { DriverDetailsSheet, type AdminDriverDetails } from "@/components/admin/driver-details-sheet"

export default async function AdminDriversPage() {
  await requireAdmin()

  const drivers = await db.driver.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      plate: true,
      licenseNumber: true,
      notes: true,
      status: true,
      store: {
        select: {
          name: true,
          slug: true,
        },
      },
      deliveries: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          store: {
            select: {
              name: true,
              slug: true,
            },
          },
          order: {
            select: {
              id: true,
              total: true,
              customerEmail: true,
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  })

  const details: AdminDriverDetails[] = drivers.map((driver) => {
    const stores = Array.from(
      new Map(
        [
          driver.store,
          ...driver.deliveries.map((delivery) => delivery.store),
        ]
          .filter(Boolean)
          .map((store) => [store!.slug, store!])
      ).values()
    )
    const accepted = driver.deliveries.filter((delivery) => delivery.status === "ASSIGNED").length
    const sent = driver.deliveries.filter((delivery) => delivery.status === "IN_TRANSIT").length
    const completed = driver.deliveries.filter((delivery) => delivery.status === "DELIVERED").length
    const failed = driver.deliveries.filter((delivery) => delivery.status === "CANCELLED").length

    return {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      plate: driver.plate,
      licenseNumber: driver.licenseNumber,
      notes: driver.notes,
      status: driver.status,
      scopeLabel: driver.store ? `Asignado a ${driver.store.name}` : "General para cualquier tienda",
      primaryStore: driver.store,
      stores,
      metrics: [
        { label: "Aceptados", value: accepted },
        { label: "Enviados", value: sent },
        { label: "Completados", value: completed },
        { label: "Erroneos", value: failed },
      ],
      recentDeliveries: driver.deliveries.slice(0, 8).map((delivery) => ({
        id: delivery.id,
        status: delivery.status,
        orderId: delivery.order.id,
        orderTotal: delivery.order.total,
        customerName: delivery.order.customer?.name ?? delivery.order.customerEmail ?? "Cliente sin nombre",
        storeName: delivery.store.name,
        createdAtLabel: new Date(delivery.createdAt).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      })),
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Repartidores</h1>
        <p className="text-sm text-muted-foreground">{details.length} registrados</p>
      </div>

      {details.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No hay repartidores registrados.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {details.map((driver) => (
            <DriverDetailsSheet key={driver.id} driver={driver} />
          ))}
        </div>
      )}
    </div>
  )
}
