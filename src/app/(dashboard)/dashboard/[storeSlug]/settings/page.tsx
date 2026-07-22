import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form"
import { SubscriptionManager } from "@/components/dashboard/subscription-manager"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [membership, cities, plans] = await Promise.all([
    db.storeMember.findFirst({
      where: {
        userId: session.user.id,
        store: { slug: storeSlug },
        role: { in: ["OWNER", "STAFF"] },
      },
      include: {
        store: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            logoUrl: true,
            bannerUrl: true,
            primaryColor: true,
            fontFamily: true,
            cityId: true,
            customDomain: true,
            isActive: true,
            stripeOnboarded: true,
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
    db.city.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.plan.findMany({
      where: { isActive: true },
      select: { id: true, name: true, priceMonthly: true, commissionRate: true, maxProducts: true, maxOrdersMonth: true, stripePriceId: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ])

  if (!membership) redirect("/dashboard")

  const store = membership.store

  return (
    <div className="space-y-6">
      <StoreSettingsForm
      storeSlug={storeSlug}
      cities={cities}
      isOwner={membership.role === "OWNER"}
      stripeOnboarded={store.stripeOnboarded}
      initialData={{
        slug: store.slug,
        name: store.name,
        description: store.description ?? undefined,
        logoUrl: store.logoUrl ?? undefined,
        bannerUrl: store.bannerUrl ?? undefined,
        primaryColor: store.primaryColor ?? "#000000",
        fontFamily: store.fontFamily ?? "Inter",
        cityId: store.cityId ?? undefined,
        customDomain: store.customDomain ?? undefined,
        isActive: store.isActive,
      }}
      />
      <SubscriptionManager
        storeSlug={storeSlug}
        isOwner={membership.role === "OWNER"}
        plans={plans.map(({ stripePriceId, ...plan }) => ({ ...plan, availableInStripe: Boolean(stripePriceId) }))}
        subscription={store.subscription ? {
          ...store.subscription,
          currentPeriodEnd: store.subscription.currentPeriodEnd?.toISOString() ?? null,
        } : null}
      />
    </div>
  )
}
