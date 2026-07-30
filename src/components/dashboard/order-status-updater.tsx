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

  async function handleChange(nextStatus: OrderStatus) {
    if (nextStatus === status) return
    const previousStatus = status
    setStatus(nextStatus)
    setLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al actualizar")
      setStatus(previousStatus)
      return
    }
    toast.success("Estado actualizado")
    router.refresh()
  }

  return (
    <Select value={status} onValueChange={(value) => void handleChange(value as OrderStatus)} disabled={loading}>
      <SelectTrigger className="w-56">
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
  )
}
