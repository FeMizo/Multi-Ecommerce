"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "DELETED"] as const
type ProductStatus = (typeof PRODUCT_STATUSES)[number]

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  DELETED: "Borrado",
}

export function ProductStatusUpdater({
  storeSlug,
  productId,
  currentStatus,
}: {
  storeSlug: string
  productId: string
  currentStatus: ProductStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState<ProductStatus>(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleChange(nextStatus: ProductStatus) {
    if (nextStatus === status) return

    if (nextStatus === "DELETED" && !window.confirm("Eliminar este producto? Esta accion no se puede deshacer.")) {
      return
    }

    const previousStatus = status
    setStatus(nextStatus)
    setLoading(true)

    const res =
      nextStatus === "DELETED"
        ? await fetch(`/api/stores/${storeSlug}/products/${productId}`, { method: "DELETE" })
        : await fetch(`/api/stores/${storeSlug}/products/${productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
          })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.message ?? "Error al actualizar")
      setStatus(previousStatus)
      return
    }

    toast.success(nextStatus === "DELETED" ? "Producto eliminado" : "Estado actualizado")
    router.refresh()
  }

  return (
    <Select value={status} onValueChange={(value) => void handleChange(value as ProductStatus)} disabled={loading}>
      <SelectTrigger className="h-8 w-32 justify-center">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRODUCT_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
