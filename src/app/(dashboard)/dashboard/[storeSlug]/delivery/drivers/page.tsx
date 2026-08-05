import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getStoreAccess } from "@/lib/store-access"
import { DriverManager } from "@/components/delivery/driver-manager"

export default async function DeliveryDriversPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getStoreAccess(session.user.id, storeSlug)
  if (!membership) redirect("/dashboard")

  const drivers = await db.driver.findMany({
    where: { storeId: membership.store.id },
    select: {
      id: true,
      name: true,
      phone: true,
      plate: true,
      licenseNumber: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      deliveries: {
        where: { status: { in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] } },
        select: { id: true, status: true },
        take: 1,
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  })

  return (
    <DriverManager
      storeSlug={storeSlug}
      drivers={drivers.map((driver) => ({
        ...driver,
        activeDelivery: driver.deliveries[0] ?? null,
      }))}
      canManage={membership.role === "OWNER"}
    />
  )
}
