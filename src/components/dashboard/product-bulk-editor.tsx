"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductStatusUpdater } from "@/components/dashboard/product-status-updater"
import { formatPrice } from "@/lib/utils"

type ProductStatusValue = "DRAFT" | "ACTIVE" | "PAUSED" | "DELETED"
type BulkAction = "status" | "setPrice" | "adjustPricePercent" | "setStock" | "featured" | "delete"

type ProductRow = {
  id: string
  name: string
  sku: string | null
  price: number
  comparePrice: number | null
  stock: number
  manageStock: boolean
  status: ProductStatusValue
  featured: boolean
  category: { name: string }
}

const STATUS_LABELS: Record<Exclude<ProductStatusValue, "DELETED">, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
}

export function ProductBulkEditor({
  storeSlug,
  products,
}: {
  storeSlug: string
  products: ProductRow[]
}) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [action, setAction] = useState<BulkAction>("status")
  const [status, setStatus] = useState<Exclude<ProductStatusValue, "DELETED">>("ACTIVE")
  const [price, setPrice] = useState("")
  const [percent, setPercent] = useState("")
  const [stock, setStock] = useState("")
  const [featured, setFeatured] = useState("true")
  const [loading, setLoading] = useState(false)

  const selectedCount = selectedIds.length
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.includes(product.id)),
    [products, selectedIds]
  )
  const allSelected = products.length > 0 && selectedCount === products.length

  function toggleProduct(productId: string) {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    )
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : products.map((product) => product.id))
  }

  function buildPayload() {
    if (action === "status") return { action, productIds: selectedIds, status }
    if (action === "setPrice") return { action, productIds: selectedIds, price: Number(price) }
    if (action === "adjustPricePercent") return { action, productIds: selectedIds, percent: Number(percent) }
    if (action === "setStock") return { action, productIds: selectedIds, stock: Number(stock) }
    if (action === "featured") return { action, productIds: selectedIds, featured: featured === "true" }
    return { action, productIds: selectedIds }
  }

  function validateAction() {
    if (selectedIds.length === 0) return "Selecciona al menos un producto"
    if (action === "setPrice" && (!price || Number(price) <= 0)) return "Ingresa un precio valido"
    if (action === "adjustPricePercent" && (percent === "" || Number(percent) < -99 || Number(percent) > 500)) return "Ingresa un porcentaje entre -99 y 500"
    if (action === "setStock" && (!stock || Number(stock) < 0 || !Number.isInteger(Number(stock)))) return "Ingresa un stock entero valido"
    return null
  }

  async function applyBulkAction() {
    const validationError = validateAction()
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (action === "delete") {
      const names = selectedProducts.slice(0, 3).map((product) => product.name).join(", ")
      const suffix = selectedCount > 3 ? ` y ${selectedCount - 3} mas` : ""
      if (!window.confirm(`Eliminar ${selectedCount} producto(s): ${names}${suffix}?`)) return
    }

    setLoading(true)
    const response = await fetch(`/api/stores/${storeSlug}/products/bulk`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    })
    setLoading(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.message ?? "No se pudo actualizar")
      return
    }

    const data = await response.json().catch(() => ({ updated: selectedCount }))
    toast.success(`${data.updated ?? selectedCount} producto(s) actualizados`)
    setSelectedIds([])
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-3">
        <div className="min-w-[150px]">
          <p className="text-xs font-medium text-muted-foreground">Seleccionados</p>
          <p className="text-sm font-semibold">{selectedCount} de {products.length}</p>
        </div>
        <div className="w-48">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Accion masiva</p>
          <Select value={action} onValueChange={(value) => setAction(value as BulkAction)} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Cambiar estado</SelectItem>
              <SelectItem value="setPrice">Fijar precio</SelectItem>
              <SelectItem value="adjustPricePercent">Ajustar precio %</SelectItem>
              <SelectItem value="setStock">Fijar stock</SelectItem>
              <SelectItem value="featured">Destacado</SelectItem>
              <SelectItem value="delete">Eliminar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {action === "status" && (
          <div className="w-44">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Estado</p>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {action === "setPrice" && (
          <div className="w-40">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Precio MXN</p>
            <Input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0.01" step="0.01" disabled={loading} />
          </div>
        )}

        {action === "adjustPricePercent" && (
          <div className="w-40">
            <p className="mb-1 text-xs font-medium text-muted-foreground">% ajuste</p>
            <Input value={percent} onChange={(event) => setPercent(event.target.value)} type="number" min="-99" max="500" step="0.01" disabled={loading} />
          </div>
        )}

        {action === "setStock" && (
          <div className="w-40">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Stock</p>
            <Input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" step="1" disabled={loading} />
          </div>
        )}

        {action === "featured" && (
          <div className="w-40">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Destacado</p>
            <Select value={featured} onValueChange={setFeatured} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Si</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={() => void applyBulkAction()} disabled={loading || selectedCount === 0} variant={action === "delete" ? "destructive" : "default"}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : action === "delete" ? <Trash2 className="mr-2 h-4 w-4" /> : null}
          Aplicar
        </Button>
        <Button type="button" variant="ghost" onClick={() => setSelectedIds([])} disabled={loading || selectedCount === 0}>
          Limpiar
        </Button>
      </div>

      <div className="rounded-xl border overflow-x-auto overflow-hidden">
        <table className="min-w-max w-full whitespace-nowrap text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input
                  aria-label="Seleccionar todos los productos"
                  checked={allSelected}
                  onChange={toggleAll}
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium">Producto</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
              <th className="text-right px-4 py-3 font-medium">Precio</th>
              <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Stock</th>
              <th className="text-center px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => {
              const selected = selectedIds.includes(product.id)
              return (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors data-[selected=true]:bg-muted/40" data-selected={selected}>
                  <td className="px-4 py-3">
                    <input
                      aria-label={`Seleccionar ${product.name}`}
                      checked={selected}
                      onChange={() => toggleProduct(product.id)}
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}
                    {product.featured && (
                      <p className="text-xs text-amber-700">Destacado</p>
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
                    <span className={product.manageStock && product.stock === 0 ? "text-destructive font-medium" : ""}>
                      {product.manageStock ? product.stock : "Libre"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProductStatusUpdater
                      key={`${product.id}-${product.status}`}
                      storeSlug={storeSlug}
                      productId={product.id}
                      currentStatus={product.status}
                    />
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
    </div>
  )
}
