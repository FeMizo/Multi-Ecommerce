"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Props = {
  orderId: string
}

export function AdminUnassignDriverButton({ orderId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function unassignDriver() {
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}/delivery/driver`, { method: "DELETE" })
    setLoading(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo quitar el repartidor")
      return
    }

    toast.success("Repartidor quitado")
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void unassignDriver()} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Quitar repartidor
    </Button>
  )
}
