"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Props = { storeId: string; isActive: boolean; isVerified: boolean }

export function StoreToggles({ storeId, isActive, isVerified }: Props) {
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => update({ isActive: !isActive })}
        disabled={loading}
        className="text-xs h-7 px-2"
      >
        {isActive ? "Activa" : "Inactiva"}
      </Button>
      <Button
        variant={isVerified ? "secondary" : "ghost"}
        size="sm"
        onClick={() => update({ isVerified: !isVerified })}
        disabled={loading}
        className="text-xs h-7 px-2"
      >
        {isVerified ? "✓ Verificada" : "Verificar"}
      </Button>
    </div>
  )
}
