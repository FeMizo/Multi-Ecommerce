import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Plus, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "Activo", variant: "default" },
  DRAFT: { label: "Borrador", variant: "secondary" },
  PAUSED: { label: "Pausado", variant: "outline" },
  DELETED: { label: "Eliminado", variant: "destructive" },
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

  const products = await db.product.findMany({
    where: { storeId: store.id, deletedAt: null },
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos en total</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${storeSlug}/products/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">Sin productos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Agrega tu primer producto para empezar a vender
          </p>
          <Button asChild>
            <Link href={`/dashboard/${storeSlug}/products/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Crear producto
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Producto</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 font-medium">Precio</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Stock</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => {
                const status = statusConfig[product.status] ?? { label: product.status, variant: "secondary" as const }
                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {product.category.name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(product.price)}
                      {product.comparePrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.comparePrice)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={product.stock === 0 ? "text-destructive font-medium" : ""}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/${storeSlug}/products/${product.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
