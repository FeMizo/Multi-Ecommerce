import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ChevronRight, Package, ShieldCheck, Sparkles, Store, Truck, User } from "lucide-react"

export default async function DashboardIndexPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const isPlatformAdmin = session.user.globalRole === "PLATFORM_ADMIN"

  const [sellerPanels, riderPanels] = await Promise.all([
    db.storeMember.findMany({
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
    }),
    session.user.email
      ? db.driver.findMany({
          where: {
            email: session.user.email.trim().toLowerCase(),
          },
          select: {
            id: true,
            name: true,
            status: true,
            store: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ])

  const firstSellerStoreSlug = sellerPanels[0]?.store.slug ?? null
  const assignedRiderStoreSlug = riderPanels.find((driver) => driver.store)?.store?.slug ?? null
  const sellerDashboardHref = firstSellerStoreSlug ? `/dashboard/${firstSellerStoreSlug}` : "/onboarding"
  const riderDashboardHref = assignedRiderStoreSlug ? `/rider/${assignedRiderStoreSlug}` : "/rider"
  const buyerDashboardHref = "/account/orders"

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Card className="overflow-hidden border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] shadow-sm">
        <CardContent className="grid gap-6 p-6 xl:grid-cols-[1.25fr_.95fr] xl:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Centro de control
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Elige tu panel de trabajo</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Este dashboard te lleva al panel correcto sin mezclar funciones. Usa vendedor, repartidor o
                comprador segun la tarea que quieras hacer.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {sellerPanels.length} tiendas
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {riderPanels.length} cuentas de reparto
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {isPlatformAdmin ? "Admin disponible" : "Cuenta personal"}
              </Badge>
            </div>
          </div>

          <div className="rounded-3xl border bg-background/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start gap-3 border-b pb-4">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Acceso rapido</p>
                <p className="text-sm text-muted-foreground">Un clic para entrar al panel que te toca.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Button asChild className="justify-between rounded-2xl" variant="outline">
                <Link href={sellerDashboardHref}>
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Vendedor
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="justify-between rounded-2xl" variant="outline">
                <Link href={riderDashboardHref}>
                  <span className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Repartidor
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="justify-between rounded-2xl" variant="outline">
                <Link href={buyerDashboardHref}>
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Comprador
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              {isPlatformAdmin && (
                <Button asChild className="justify-between rounded-2xl" variant="secondary">
                  <Link href="/admin">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="h-full border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-4 w-4 text-primary" />
                Vendedor
              </CardTitle>
              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                {sellerPanels.length}
              </Badge>
            </div>
            <CardDescription>Abre la tienda que administras o crea una nueva.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sellerPanels.length > 0 ? (
              <div className="space-y-2">
                {sellerPanels.slice(0, 3).map((membership) => (
                  <Link
                    key={`${membership.store.slug}-${membership.role}`}
                    href={`/dashboard/${membership.store.slug}`}
                    className="group flex items-center justify-between rounded-2xl border bg-background px-4 py-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{membership.store.name}</p>
                      <p className="text-xs text-muted-foreground">{membership.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {membership.store.isVerified && (
                        <Badge variant="success" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          Verificada
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                No tienes tiendas activas todavia.
              </div>
            )}
            <Button asChild className="w-full justify-between rounded-2xl" variant="outline">
              <Link href={sellerDashboardHref}>
                {sellerPanels.length > 0 ? "Abrir panel de vendedor" : "Crear tienda"}
                <Package className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" />
                Repartidor
              </CardTitle>
              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                {riderPanels.length}
              </Badge>
            </div>
            <CardDescription>Entra a tu panel de reparto o registra una cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {riderPanels.length > 0 ? (
              <div className="space-y-2">
                {riderPanels.slice(0, 3).map((driver) => {
                  const href = driver.store ? `/rider/${driver.store.slug}` : "/rider"

                  return (
                    <Link
                      key={driver.id}
                      href={href}
                      className="group flex items-center justify-between rounded-2xl border bg-background px-4 py-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{driver.store?.name ?? "Repartidor sin tienda"}</p>
                        <p className="text-xs text-muted-foreground">{driver.name}</p>
                      </div>
                      <Badge variant={driver.status === "AVAILABLE" ? "success" : "outline"} className="shrink-0">
                        {driver.status}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                Registra tu cuenta de repartidor para ver tu panel aqui.
              </div>
            )}
            <Button asChild className="w-full justify-between rounded-2xl" variant="outline">
              <Link href={riderDashboardHref}>
                {riderPanels.length > 0 ? "Abrir panel de repartidor" : "Registrar repartidor"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Comprador
              </CardTitle>
              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                Cuenta
              </Badge>
            </div>
            <CardDescription>Revisa pedidos, perfil y favoritos desde tu cuenta personal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              Tu panel de comprador vive en tu cuenta personal y no requiere suscripcion.
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full justify-between rounded-2xl" variant="outline">
                <Link href="/account/orders">
                  Mis pedidos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between rounded-2xl" variant="outline">
                <Link href="/account/profile">
                  Mi perfil
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between rounded-2xl" variant="outline">
                <Link href="/account/favorites">
                  Mis favoritos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
