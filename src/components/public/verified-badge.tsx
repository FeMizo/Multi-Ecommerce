import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type VerifiedBadgeProps = {
  className?: string
  compact?: boolean
}

export function VerifiedBadge({ className, compact = false }: VerifiedBadgeProps) {
  return (
    <Badge
      variant="secondary"
      title="Tienda verificada"
      aria-label="Tienda verificada"
      className={`cursor-help bg-primary/10 text-primary border-0 hover:bg-primary/10 ${className ?? ""}`}
    >
      <CheckCircle2 className={`mr-1 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
      Verificada
    </Badge>
  )
}
