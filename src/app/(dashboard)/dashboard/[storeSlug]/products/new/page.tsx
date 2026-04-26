import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ProductForm } from "@/components/dashboard/product-form"

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

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
