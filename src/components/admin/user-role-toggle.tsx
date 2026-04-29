"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { DeleteIconButton } from "@/components/admin/action-buttons"

type Props = { userId: string; currentRole: string; currentUserId?: string }

export function UserRoleToggle({ userId, currentRole, currentUserId }: Props) {
  const [roleLoading, setRoleLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setRoleLoading(true)
    const newRole = currentRole === "PLATFORM_ADMIN" ? "USER" : "PLATFORM_ADMIN"
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalRole: newRole }),
    })
    setRoleLoading(false)
    if (!res.ok) { toast.error("Error al actualizar rol"); return }
    toast.success("Rol actualizado")
    router.refresh()
  }

  async function deleteUser() {
    if (userId === currentUserId) { toast.error("No puedes eliminarte a ti mismo"); return }
    if (!window.confirm("¿Eliminar este usuario?")) return
    setDeleteLoading(true)
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
    setDeleteLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "Error al eliminar")
      return
    }
    toast.success("Usuario eliminado")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={currentRole === "PLATFORM_ADMIN" ? "destructive" : "outline"}
        size="sm"
        onClick={toggle}
        disabled={roleLoading || deleteLoading}
      >
        {roleLoading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : currentRole === "PLATFORM_ADMIN" ? "Quitar admin" : "Hacer admin"}
      </Button>
      <DeleteIconButton onClick={deleteUser} loading={deleteLoading} disabled={roleLoading} />
    </div>
  )
}
