import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StoreCouponsManager } from "@/components/dashboard/store-coupons-manager"

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await db.storeMember.findFirst({
    where: {
      userId: session.user.id,
      store: { slug: storeSlug },
      role: "OWNER",
    },
    include: { store: { select: { id: true, name: true, slug: true } } },
  })

  if (!membership) redirect("/dashboard")

  const coupons = await db.storeCoupon.findMany({
    where: { storeId: membership.store.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">/{storeSlug}</p>
          <h1 className="text-2xl font-bold">Cupones</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${storeSlug}/settings`}>Configuración</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Cada cupón pertenece solo a esta tienda y se valida en checkout antes de confirmar el pedido.
        </CardContent>
      </Card>

      <StoreCouponsManager storeSlug={storeSlug} coupons={coupons} />
    </div>
  )
}
