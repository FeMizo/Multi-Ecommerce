import Link from "next/link"
import { redirect } from "next/navigation"
import { MapPinOff } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RiderActiveDeliveryCard } from "@/components/delivery/rider-active-delivery-card"

type Params = { storeSlug: string }

export default async function RiderPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/rider/${storeSlug}`)}`)
  }

  const driver = await db.driver.findFirst({
    where: {
      store: { slug: storeSlug },
      email: session.user.email.trim().toLowerCase(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      store: { select: { id: true, name: true, slug: true } },
    },
  })

  if (!driver || !driver.store) {
    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-16">
        <Card className="w-full">
          <CardContent className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <MapPinOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">No tienes acceso a este panel</p>
              <p className="text-sm text-muted-foreground">
                Tu cuenta no está registrada como repartidor de esta tienda.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Volver al sitio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const delivery = await db.delivery.findFirst({
    where: {
      storeId: driver.store.id,
      driverId: driver.id,
      status: { in: ["ASSIGNED", "IN_TRANSIT"] },
    },
    select: {
      id: true,
      status: true,
      formattedAddress: true,
      lat: true,
      lng: true,
      notes: true,
      order: {
        select: {
          id: true,
          total: true,
          customerEmail: true,
          customer: { select: { name: true, phone: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              productSnapshot: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{driver.store.name}</p>
          <h1 className="text-2xl font-bold">Hola, {driver.name}</h1>
          <p className="text-sm text-muted-foreground">/{driver.store.slug}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/login`}>Cambiar cuenta</Link>
        </Button>
      </div>

      {delivery ? (
        <RiderActiveDeliveryCard storeSlug={storeSlug} delivery={delivery} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-semibold">No tienes pedidos activos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando te asignen una entrega aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
