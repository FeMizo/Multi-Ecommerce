import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [membership, cities] = await Promise.all([
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
            isVerified: true,
            description: true,
            logoUrl: true,
            bannerUrl: true,
            primaryColor: true,
            fontFamily: true,
            cityId: true,
            customDomain: true,
            isActive: true,
            cashOnDeliveryEnabled: true,
            transferEnabled: true,
            transferAccountName: true,
            transferAccountNumber: true,
            transferBank: true,
            transferReferencePrefix: true,
            transferReferenceExtra: true,
            stripeOnboarded: true,
          },
        },
      },
    }),
    db.city.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
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
        canManageVisibility={membership.role === "OWNER" || membership.role === "STAFF"}
        stripeOnboarded={store.stripeOnboarded}
        cashOnDeliveryEnabled={store.cashOnDeliveryEnabled}
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
          cashOnDeliveryEnabled: store.cashOnDeliveryEnabled,
          transferEnabled: store.transferEnabled,
          transferAccountName: store.transferAccountName ?? undefined,
          transferAccountNumber: store.transferAccountNumber ?? undefined,
          transferBank: store.transferBank ?? undefined,
          transferReferencePrefix: store.transferReferencePrefix ?? undefined,
          transferReferenceExtra: store.transferReferenceExtra ?? undefined,
          isVerified: store.isVerified,
        }}
      />
    </div>
  )
}
