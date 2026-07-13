"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function RefundButton({ storeSlug, orderId }: { storeSlug: string; orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function refund() {
    if (!window.confirm("¿Reembolsar el pago completo y reponer el stock?")) return
    setLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/orders/${orderId}/refund`, { method: "POST" })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return toast.error(data.message ?? "No se pudo solicitar el reembolso")

    toast.success(data.status === "succeeded" ? "Pago reembolsado" : "Reembolso en proceso")
    router.refresh()
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={refund}>
      {loading ? "Procesando..." : "Reembolsar pago"}
    </Button>
  )
}
