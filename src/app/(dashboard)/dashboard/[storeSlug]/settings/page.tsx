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
            description: true,
            logoUrl: true,
            bannerUrl: true,
            primaryColor: true,
            fontFamily: true,
            cityId: true,
            customDomain: true,
            isActive: true,
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
    <StoreSettingsForm
      storeSlug={storeSlug}
      cities={cities}
      isOwner={membership.role === "OWNER"}
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
  )
}
