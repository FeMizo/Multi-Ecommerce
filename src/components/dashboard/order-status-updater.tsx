"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/order-status"

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
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
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
