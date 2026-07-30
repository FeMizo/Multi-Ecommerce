import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SubscriptionManager } from "@/components/dashboard/subscription-manager"
import { Button } from "@/components/ui/button"

export default async function PlanesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [membership, plans] = await Promise.all([
    db.storeMember.findFirst({
      where: {
        userId: session.user.id,
        store: { slug: storeSlug },
        role: "OWNER",
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscription: {
              select: {
                planId: true,
                status: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                stripeSubscriptionId: true,
              },
            },
          },
        },
      },
    }),
    db.plan.findMany({
      where: { isActive: true },
      select: { id: true, name: true, priceMonthly: true, commissionRate: true, maxProducts: true, maxOrdersMonth: true, stripePriceId: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ])

  if (!membership) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">/{storeSlug}</p>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-sm text-muted-foreground">Administra la suscripcion de tu tienda.</p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/dashboard/${storeSlug}/settings`}>Configuracion</Link>
        </Button>
      </div>

      <SubscriptionManager
        storeSlug={storeSlug}
        isOwner={membership.role === "OWNER"}
        plans={plans.map(({ stripePriceId, ...plan }) => ({ ...plan, availableInStripe: Boolean(stripePriceId) }))}
        subscription={membership.store.subscription ? {
          ...membership.store.subscription,
          currentPeriodEnd: membership.store.subscription.currentPeriodEnd?.toISOString() ?? null,
        } : null}
      />
    </div>
  )
}
