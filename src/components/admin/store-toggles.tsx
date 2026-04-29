"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { DeleteIconButton, ToggleStatusButton } from "@/components/admin/action-buttons"

type Props = { storeId: string; isActive: boolean; isVerified: boolean }

export function StoreToggles({ storeId, isActive, isVerified }: Props) {
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  async function update(data: Partial<{ isActive: boolean; isVerified: boolean }>) {
    setLoading(true)
    const res = await fetch(`/api/admin/stores/${storeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (!res.ok) { toast.error("Error al actualizar"); return }
    router.refresh()
  }

  async function deleteStore() {
    if (!window.confirm("¿Eliminar esta tienda?")) return
    setDeleteLoading(true)
    const res = await fetch(`/api/admin/stores/${storeId}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (!res.ok) { toast.error("Error al eliminar"); return }
    toast.success("Tienda eliminada")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <ToggleStatusButton
        active={isActive}
        onClick={() => update({ isActive: !isActive })}
        loading={loading}
        disabled={deleteLoading}
      />
      <Button
        variant={isVerified ? "secondary" : "ghost"}
        size="sm"
        onClick={() => update({ isVerified: !isVerified })}
        disabled={loading || deleteLoading}
        className="text-xs h-7 px-2"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : isVerified ? "✓ Verificada" : "Verificar"}
      </Button>
      <DeleteIconButton onClick={deleteStore} loading={deleteLoading} disabled={loading} />
    </div>
  )
}
