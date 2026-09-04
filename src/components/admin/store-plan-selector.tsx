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

const NO_PLAN = "__none__"

export function StorePlanSelector({ storeId, plans, currentPlanId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentPlanId ?? NO_PLAN)
  const [loading, setLoading] = useState(false)

  async function removePlan() {
    setLoading(true)
    const res = await fetch(`/api/admin/stores/${storeId}/subscription`, { method: "DELETE" })
    setLoading(false)
    if (!res.ok) { toast.error("Error al quitar plan"); return }
    setSelected(NO_PLAN)
    toast.success("Plan desasignado")
    router.refresh()
  }

  async function assign() {
    if (selected === NO_PLAN) return removePlan()
    if (selected === currentPlanId) return
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
          <SelectItem value={NO_PLAN} className="text-xs">Sin plan</SelectItem>
          {plans.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs">
              {p.name} - directa {(p.commissionRate * 100).toFixed(2)}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected !== (currentPlanId ?? NO_PLAN) && (
        <Button size="sm" className="h-7 text-xs px-2" disabled={loading} onClick={assign}>
          {selected === NO_PLAN ? "Quitar" : "Asignar"}
        </Button>
      )}
      {currentPlanId && selected === currentPlanId && (
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={loading} onClick={removePlan}>
          Quitar
        </Button>
      )}
    </div>
  )
}
