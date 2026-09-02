import { redirect } from "next/navigation"
import Link from "next/link"
import type { ReactNode } from "react"
import { Plus, Package } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkProductLimit, getEffectivePlan } from "@/lib/plan-limits"
import { Button } from "@/components/ui/button"
import { ProductImportButton } from "@/components/dashboard/product-import-button"
import { ProductBulkEditor } from "@/components/dashboard/product-bulk-editor"

function NewProductButton({
  storeSlug,
  productLimitReached,
  count,
  max,
  children,
}: {
  storeSlug: string
  productLimitReached: boolean
  count: number
  max: number | null
  children: ReactNode
}) {
  const title = productLimitReached ? `Limite de productos alcanzado (${count}/${max})` : undefined

  if (productLimitReached) {
    return (
      <Button disabled title={title}>
        <Plus className="h-4 w-4 mr-2" />
        {children}
      </Button>
    )
  }

  return (
    <Button asChild>
      <Link href={`/dashboard/${storeSlug}/products/new`}>
        <Plus className="h-4 w-4 mr-2" />
        {children}
      </Link>
    </Button>
  )
}

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true },
  })
  if (!store) redirect("/dashboard")
  if (!await getEffectivePlan(store.id)) redirect(`/dashboard/${storeSlug}/planes?billing=required`)

  const [products, productLimit] = await Promise.all([
    db.product.findMany({
      where: { storeId: store.id, deletedAt: null },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    checkProductLimit(store.id),
  ])
  const productLimitReached = !productLimit.ok

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos en total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProductImportButton storeSlug={storeSlug} disabled={productLimitReached} />
          <NewProductButton
            storeSlug={storeSlug}
            productLimitReached={productLimitReached}
            count={productLimit.count}
            max={productLimit.max}
          >
            Nuevo producto
          </NewProductButton>
        </div>
      </div>

      {productLimitReached && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Limite de productos alcanzado ({productLimit.count}/{productLimit.max}). Actualiza tu plan o elimina productos para agregar mas.
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-3 py-20 text-center border rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">Sin productos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Agrega tu primer producto para empezar a vender
          </p>
          <div className="flex flex-wrap gap-2">
            <ProductImportButton storeSlug={storeSlug} disabled={productLimitReached} />
            <NewProductButton
              storeSlug={storeSlug}
              productLimitReached={productLimitReached}
              count={productLimit.count}
              max={productLimit.max}
            >
              Crear producto
            </NewProductButton>
          </div>
        </div>
      ) : (
        <ProductBulkEditor
          storeSlug={storeSlug}
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            comparePrice: product.comparePrice,
            stock: product.stock,
            manageStock: product.manageStock,
            status: product.status,
            featured: product.featured,
            category: { name: product.category.name },
          }))}
        />
      )}
    </div>
  )
}
