import { db } from "@/lib/db"

export type StoreAccessRole = "OWNER" | "STAFF"

export async function getStoreAccess(userId: string, storeSlug: string, roles: StoreAccessRole[] = ["OWNER", "STAFF"]) {
  return db.storeMember.findFirst({
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
}

export async function getOwnedStoreAccess(userId: string, storeSlug: string) {
  return getStoreAccess(userId, storeSlug, ["OWNER"])
}
