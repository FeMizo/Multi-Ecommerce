import { db } from "@/lib/db"

export type StoreAccessRole = "OWNER" | "STAFF"

export async function getStoreAccess(userId: string, storeSlug: string, roles: StoreAccessRole[] = ["OWNER", "STAFF"]) {
  const membership = await db.storeMember.findFirst({
    where: {
      userId,
      store: { slug: storeSlug },
      role: { in: roles },
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  if (membership) return membership

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { globalRole: true },
  })
  if (user?.globalRole !== "PLATFORM_ADMIN") return null

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  return store ? { id: `admin:${store.id}`, userId, storeId: store.id, role: "OWNER" as const, createdAt: new Date(), store } : null
}

export async function getOwnedStoreAccess(userId: string, storeSlug: string) {
  return getStoreAccess(userId, storeSlug, ["OWNER"])
}
