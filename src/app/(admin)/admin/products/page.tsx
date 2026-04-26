import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  DRAFT: "Borrador",
  PAUSED: "Pausado",
  DELETED: "Eliminado",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  DRAFT: "secondary",
  PAUSED: "outline",
  DELETED: "destructive",
}

type SearchParams = { status?: string; page?: string }

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const { status, page } = await searchParams
  const take = 50
  const skip = ((Number(page) || 1) - 1) * take

  const where = {
    deletedAt: null,
    ...(status ? { status: status as "ACTIVE" | "DRAFT" | "PAUSED" | "DELETED" } : {}),
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        store: { select: { name: true, slug: true } },
        category: { select: { name: true } },
      },
    }),
    db.product.count({ where }),
  ])

  const statuses = ["ACTIVE", "DRAFT", "PAUSED", "DELETED"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <p className="text-sm text-muted-foreground">{total} encontrados</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link
          href="/admin/products"
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            !status
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:bg-accent border-input"
          }`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/products?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-accent border-input"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">Producto</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tienda</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Categoría</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Precio</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Stock</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-4">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku || product.id.slice(0, 8)}
                    </p>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/${product.store.slug}`}
                      className="hover:underline text-muted-foreground"
                    >
                      {product.store.name}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground">{product.category.name}</td>
                  <td className="p-4 text-right font-medium">{formatPrice(product.price)}</td>
                  <td className="p-4 text-center">{product.stock}</td>
                  <td className="p-4 text-center">
                    <Badge variant={STATUS_VARIANTS[product.status] ?? "secondary"}>
                      {STATUS_LABELS[product.status] ?? product.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
