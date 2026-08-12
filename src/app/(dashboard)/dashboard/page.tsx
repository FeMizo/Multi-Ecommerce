import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Store, User } from "lucide-react"

export default async function DashboardIndexPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const sellerPanels = await db.storeMember.findMany({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "STAFF"] },
    },
    include: {
      store: {
        select: {
          name: true,
          slug: true,
          isVerified: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  })

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Accede a tu panel de vendedor o comprador desde un mismo lugar.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4" />
              Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sellerPanels.length > 0 ? (
              <div className="space-y-2">
                {sellerPanels.map((membership) => (
                  <Link
                    key={`${membership.store.slug}-${membership.role}`}
                    href={`/dashboard/${membership.store.slug}`}
                    className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors hover:bg-accent/60"
                  >
                    <div>
                      <p className="font-medium">{membership.store.name}</p>
                      <p className="text-xs text-muted-foreground">{membership.role}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tienes tiendas activas todavia.
              </p>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href="/onboarding">Crear tienda</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Comprador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu panel de comprador vive en tu cuenta personal y no requiere suscripcion.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/account/orders">Mis pedidos</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/account/profile">Mi perfil</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/account/favorites">Mis favoritos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
