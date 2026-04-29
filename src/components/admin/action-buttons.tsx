"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"

interface DeleteIconButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

export function DeleteIconButton({ onClick, loading = false, disabled = false }: DeleteIconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={loading || disabled}
      className="text-destructive hover:text-destructive h-7 w-7 p-0"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  )
}

interface ToggleStatusButtonProps {
  active: boolean
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  activeLabel?: string
  inactiveLabel?: string
}

export function ToggleStatusButton({
  active,
  onClick,
  loading = false,
  disabled = false,
  activeLabel = "Activa",
  inactiveLabel = "Inactiva",
}: ToggleStatusButtonProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={loading || disabled}
      className="text-xs h-7 px-2"
    >
      {loading
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : active ? activeLabel : inactiveLabel}
    </Button>
  )
}
