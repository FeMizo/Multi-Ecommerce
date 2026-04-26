import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ProductForm } from "@/components/dashboard/product-form"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>
}) {
  const { storeSlug, productId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  })
  if (!store) redirect("/dashboard")

  const [product, categories] = await Promise.all([
    db.product.findFirst({
      where: { id: productId, storeId: store.id, deletedAt: null },
    }),
    db.category.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!product) notFound()

  return (
    <ProductForm
      storeSlug={storeSlug}
      categories={categories}
      mode="edit"
      initialData={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description ?? undefined,
        price: product.price,
        comparePrice: product.comparePrice ?? undefined,
        stock: product.stock,
        sku: product.sku ?? undefined,
        categoryId: product.categoryId,
        status: product.status as "DRAFT" | "ACTIVE" | "PAUSED",
        featured: product.featured,
        images: product.images,
        tags: product.tags,
      }}
    />
  )
}
