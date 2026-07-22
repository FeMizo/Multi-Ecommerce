"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Plan = { id: string; name: string; commissionRate: number }

type Props = {
  storeId: string
  plans: Plan[]
  currentPlanId?: string | null
}

export function StorePlanSelector({ storeId, plans, currentPlanId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentPlanId ?? "")
  const [loading, setLoading] = useState(false)

  async function assign() {
    if (!selected) return
    setLoading(true)
    const res = await fetch(`/api/admin/stores/${storeId}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selected }),
    })
    setLoading(false)
    if (!res.ok) { toast.error("Error al asignar plan"); return }
    toast.success("Plan asignado")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="h-7 text-xs w-32">
          <SelectValue placeholder="Sin plan" />
        </SelectTrigger>
        <SelectContent>
          {plans.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs">
              {p.name} - directa {(p.commissionRate * 100).toFixed(2)}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected !== (currentPlanId ?? "") && (
        <Button size="sm" className="h-7 text-xs px-2" disabled={loading} onClick={assign}>
          Asignar
        </Button>
      )}
    </div>
  )
}
