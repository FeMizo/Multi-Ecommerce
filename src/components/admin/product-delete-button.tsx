"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DeleteIconButton } from "@/components/admin/action-buttons"

export function ProductDeleteButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este producto?")) return
    setLoading(true)
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
    setLoading(false)
    if (!res.ok) { toast.error("Error al eliminar"); return }
    toast.success("Producto eliminado")
    router.refresh()
  }

  return <DeleteIconButton onClick={handleDelete} loading={loading} />
}
