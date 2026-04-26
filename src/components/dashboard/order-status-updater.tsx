"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
}

export function OrderStatusUpdater({
  storeSlug,
  orderId,
  currentStatus,
}: {
  storeSlug: string
  orderId: string
  currentStatus: OrderStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (status === currentStatus) return
    setLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al actualizar")
      return
    }
    toast.success("Estado actualizado")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(statusLabels) as OrderStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {statusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleSave} disabled={loading || status === currentStatus}>
        {loading ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  )
}
