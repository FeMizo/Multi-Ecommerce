import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function SellerProductsPage() {
  const session = await auth()
  const seller = await db.seller.findUnique({ where: { userId: session!.user.id } })
  if (!seller) redirect("/seller/register")

  const products = await db.product.findMany({
    where: { sellerId: seller.id },
    include: { category: true, _count: { select: { orderItems: true } } },
    orderBy: { createdAt: "desc" },
  })

  const statusColor: Record<string, string> = {
    ACTIVE: "default",
    DRAFT: "secondary",
    PAUSED: "outline",
    DELETED: "destructive",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button asChild>
          <Link href="/seller/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Ventas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Sin productos. Crea tu primer producto.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product._count.orderItems}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor[product.status] as "default" | "secondary" | "outline" | "destructive"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/seller/products/${product.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
