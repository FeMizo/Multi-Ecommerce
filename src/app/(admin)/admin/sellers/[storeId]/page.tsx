import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"

type PageProps = {
  params: Promise<{ storeId: string }>
}

export default async function AdminSellerDetailPage({ params }: PageProps) {
  await requireAdmin()
  const { storeId } = await params

  const store = await db.store.findFirst({
    where: { id: storeId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      isVerified: true,
      cashOnDeliveryEnabled: true,
      transferEnabled: true,
      transferInstructions: true,
      stripeOnboarded: true,
      stripeAccountId: true,
      createdAt: true,
      city: { select: { name: true } },
      subscription: { select: { status: true, currentPeriodEnd: true, plan: { select: { name: true, commissionRate: true } } } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, globalRole: true, createdAt: true } },
        },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
      _count: { select: { products: { where: { deletedAt: null } }, orders: true } },
    },
  })

  if (!store) notFound()

  const owner = store.members.find((member) => member.role === "OWNER")?.user ?? store.members[0]?.user
  const totalRevenue = await db.order.aggregate({
    where: { storeId: store.id, status: { in: ["PAID", "DELIVERED"] } },
    _sum: { total: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Detalle del vendedor</p>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">/{store.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/sellers">Volver</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/${store.slug}`}>Abrir dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={store.isActive ? "default" : "secondary"}>{store.isActive ? "Activa" : "Oculta"}</Badge>
              <Badge variant={store.isVerified ? "default" : "outline"}>{store.isVerified ? "Verificada" : "Sin verificar"}</Badge>
              <Badge variant={store.stripeOnboarded ? "default" : "outline"}>{store.stripeOnboarded ? "Stripe listo" : "Stripe pendiente"}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ciudad</p>
                <p className="font-medium">{store.city?.name ?? "Sin ciudad"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
                <p className="font-medium">{store.subscription?.plan.name ?? "Sin plan"}</p>
                {store.subscription?.plan.commissionRate !== undefined && (
                  <p className="text-xs text-muted-foreground">Comision: {Math.round(store.subscription.plan.commissionRate * 100)}%</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Productos</p>
                <p className="font-medium">{store._count.products}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedidos</p>
                <p className="font-medium">{store._count.orders}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</p>
                <p className="font-medium">{formatPrice(totalRevenue._sum.total ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Creada</p>
                <p className="font-medium">{store.createdAt.toLocaleDateString("es-MX")}</p>
              </div>
            </div>
            {store.description && (
              <>
                <Separator />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Descripcion</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{store.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="font-semibold">Contacto principal</p>
            <div className="space-y-1">
              <p className="font-medium">{owner?.name ?? "Sin dueño"}</p>
              <p className="text-sm text-muted-foreground">{owner?.email ?? "Sin email"}</p>
              <p className="text-sm text-muted-foreground">{owner?.phone ?? "Sin telefono"}</p>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Contra entrega:</span> {store.cashOnDeliveryEnabled ? "Si" : "No"}</p>
              <p><span className="text-muted-foreground">Transferencia:</span> {store.transferEnabled ? "Si" : "No"}</p>
              <p><span className="text-muted-foreground">Stripe:</span> {store.stripeAccountId ? "Conectado" : "No conectado"}</p>
            </div>
            {store.transferInstructions && (
              <>
                <Separator />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Instrucciones de transferencia</p>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{store.transferInstructions}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Miembros</p>
              <p className="text-sm text-muted-foreground">Detalles completos del vendedor y su equipo.</p>
            </div>
            {owner?.phone && (
              <Button variant="outline" asChild>
                <Link href={`https://wa.me/${owner.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </Link>
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {store.members.map((member) => (
              <div key={member.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{member.user.name ?? member.user.email}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    <p className="text-sm text-muted-foreground">{member.user.phone ?? "Sin telefono"}</p>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
