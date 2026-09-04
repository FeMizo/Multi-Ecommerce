"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { DeleteIconButton, ToggleStatusButton } from "@/components/admin/action-buttons"

type Props = { storeId: string; isActive: boolean; isVerified: boolean }

export function StoreToggles({ storeId, isActive, isVerified }: Props) {
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [activeState, setActiveState] = useState(isActive)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setActiveState(isActive)
  }, [isActive])

  async function updateVisibility(nextIsActive: boolean) {
    setVisibilityLoading(true)
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextIsActive }),
      })
      if (!res.ok) { toast.error("Error al actualizar"); return }

      const updatedStore = await res.json()
      setActiveState(typeof updatedStore.isActive === "boolean" ? updatedStore.isActive : nextIsActive)
      router.refresh()
    } finally {
      setVisibilityLoading(false)
    }
  }

  async function sendVerificationEmail() {
    setVerificationLoading(true)
    const res = await fetch(`/api/admin/stores/${storeId}/verification`, { method: "POST" })
    setVerificationLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "Error al enviar verificación")
      return
    }
    toast.success("Correo de verificación enviado")
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
        active={activeState}
        onClick={() => updateVisibility(!activeState)}
        loading={visibilityLoading}
        disabled={deleteLoading}
        activeLabel="Visible"
        inactiveLabel="Oculta"
      />
      <Button
        variant={isVerified ? "secondary" : "ghost"}
        size="sm"
        onClick={sendVerificationEmail}
        disabled={verificationLoading || deleteLoading || isVerified}
        className="text-xs h-7 px-2"
      >
        {verificationLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : isVerified ? "✓ Verificada" : "Verificar"}
      </Button>
      <DeleteIconButton onClick={deleteStore} loading={deleteLoading} disabled={visibilityLoading || verificationLoading} />
    </div>
  )
}
