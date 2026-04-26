import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function DashboardIndexPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await db.storeMember.findFirst({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "STAFF"] },
    },
    include: { store: { select: { slug: true } } },
    orderBy: { createdAt: "asc" },
  })

  if (!membership) redirect("/onboarding")

  redirect(`/dashboard/${membership.store.slug}`)
}
