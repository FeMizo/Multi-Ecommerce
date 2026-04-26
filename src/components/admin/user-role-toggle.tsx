"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Props = { userId: string; currentRole: string }

export function UserRoleToggle({ userId, currentRole }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const newRole = currentRole === "PLATFORM_ADMIN" ? "USER" : "PLATFORM_ADMIN"
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalRole: newRole }),
    })
    setLoading(false)
    if (!res.ok) { toast.error("Error al actualizar rol"); return }
    toast.success("Rol actualizado")
    router.refresh()
  }

  return (
    <Button
      variant={currentRole === "PLATFORM_ADMIN" ? "destructive" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {currentRole === "PLATFORM_ADMIN" ? "Quitar admin" : "Hacer admin"}
    </Button>
  )
}
