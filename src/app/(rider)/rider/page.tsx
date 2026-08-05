import Link from "next/link"
import { redirect } from "next/navigation"
import { MapPinOff, Store, Truck } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function RiderIndexPage() {
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    redirect("/login?callbackUrl=/rider")
  }

  const drivers = await db.driver.findMany({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      store: { select: { name: true, slug: true } },
    },
    orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
  })

  const assignedDrivers = drivers.filter((driver) => driver.store)
  const unassignedDrivers = drivers.filter((driver) => !driver.store)

  if (assignedDrivers.length === 1 && unassignedDrivers.length === 0) {
    redirect(`/rider/${assignedDrivers[0].store!.slug}`)
  }

  if (drivers.length > 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <Card>
          <CardContent className="space-y-6 py-8">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Panel de repartidor</h1>
              <p className="text-sm text-muted-foreground">
                Tu cuenta ya está creada. Si todavía no tienes tienda asignada, espera a que un vendedor te vincule.
              </p>
            </div>

            {assignedDrivers.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Tiendas asignadas</p>
                <div className="space-y-2">
                  {assignedDrivers.map((driver) => (
                    <Button key={driver.id} asChild className="w-full justify-start" variant="outline">
                      <Link href={`/rider/${driver.store!.slug}`}>
                        <Store className="mr-2 h-4 w-4" />
                        {driver.store!.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {unassignedDrivers.length > 0 && (
              <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 text-foreground">
                  <Truck className="h-4 w-4" />
                  <p className="font-medium">Esperando asignación</p>
                </div>
                <p>Nombre: {unassignedDrivers[0].name}</p>
                <p>Cuando te asignen una tienda, aparecerá aquí.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="space-y-4 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <MapPinOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold">No tienes acceso al rider</p>
            <p className="text-sm text-muted-foreground">
              Tu cuenta todavía no está registrada como repartidor.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/register?role=rider">Registrar repartidor</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
