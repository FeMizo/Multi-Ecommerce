import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkProductLimit } from "@/lib/plan-limits"
import { ProductForm } from "@/components/dashboard/product-form"

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  })
  if (!store) redirect("/dashboard")

  const productLimit = await checkProductLimit(store.id)
  if (!productLimit.ok) redirect(`/dashboard/${storeSlug}/products`)

  const categories = await db.category.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <ProductForm
      storeSlug={storeSlug}
      categories={categories}
      mode="new"
    />
  )
}
