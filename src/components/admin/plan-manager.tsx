"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { nonnegativeMxnSchema } from "@/lib/money"

const schema = z.object({
  name: z.string().min(2, "Requerido"),
  slug: z.string().min(2, "Requerido").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  priceMonthly: nonnegativeMxnSchema,
  commissionPercent: z.number().finite().min(0).max(100),
  maxProducts: z.number().int().positive().optional(),
  maxOrdersMonth: z.number().int().positive().optional(),
  stripePriceId: z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Plan = {
  id: string
  name: string
  slug: string
  priceMonthly: number
  commissionRate: number
  maxProducts: number | null
  maxOrdersMonth: number | null
  stripePriceId: string | null
  isActive: boolean
}

export function PlanManager({ plans: initial }: { plans: Plan[] }) {
  const router = useRouter()
  const [plans, setPlans] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priceMonthly: 0, commissionPercent: 5 },
  })

  const {
    register: regEdit,
    handleSubmit: handleEdit,
    reset: resetEdit,
    formState: { errors: errEdit },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onCreate(data: FormData) {
    setLoading(true)
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        commissionRate: data.commissionPercent / 100,
        commissionPercent: undefined,
        maxProducts: data.maxProducts ?? null,
        maxOrdersMonth: data.maxOrdersMonth ?? null,
      }),
    })
    setLoading(false)
    if (!res.ok) { toast.error("Error al crear plan"); return }
    toast.success("Plan creado")
    reset()
    setCreating(false)
    router.refresh()
  }

  async function onEdit(data: FormData) {
    if (!editingId) return
    setLoading(true)
    const res = await fetch(`/api/admin/plans/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        commissionRate: data.commissionPercent / 100,
        commissionPercent: undefined,
        maxProducts: data.maxProducts ?? null,
        maxOrdersMonth: data.maxOrdersMonth ?? null,
      }),
    })
    setLoading(false)
    if (!res.ok) { toast.error("Error al actualizar"); return }
    toast.success("Plan actualizado")
    setEditingId(null)
    router.refresh()
  }

  async function toggleActive(plan: Plan) {
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    })
    if (!res.ok) { toast.error("Error"); return }
    setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, isActive: !p.isActive } : p))
  }

  async function deletePlan(plan: Plan) {
    if (!confirm(`¿Eliminar plan "${plan.name}"?`)) return
    const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al eliminar")
      return
    }
    toast.success("Plan eliminado")
    setPlans((prev) => prev.filter((p) => p.id !== plan.id))
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id)
    resetEdit({
      name: plan.name,
      slug: plan.slug,
      priceMonthly: plan.priceMonthly,
      commissionPercent: plan.commissionRate * 100,
      maxProducts: plan.maxProducts ?? undefined,
      maxOrdersMonth: plan.maxOrdersMonth ?? undefined,
      stripePriceId: plan.stripePriceId ?? "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{plans.length} planes</p>
        <Button size="sm" onClick={() => setCreating(!creating)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo plan
        </Button>
      </div>

      {creating && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nuevo plan</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="space-y-1 col-span-2 md:col-span-1">
                <Label>Nombre</Label>
                <Input {...register("name")} placeholder="Pro" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input {...register("slug")} placeholder="pro" />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Precio mensual (MXN)</Label>
                <Input {...register("priceMonthly", { valueAsNumber: true })} type="number" step="0.01" placeholder="299" />
              </div>
              <div className="space-y-1">
                <Label>Comision venta directa (%)</Label>
                <Input {...register("commissionPercent", { valueAsNumber: true })} type="number" step="0.01" min="0" max="100" placeholder="5" />
              </div>
              <div className="space-y-1">
                <Label>Máx. productos</Label>
                <Input {...register("maxProducts", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} type="number" placeholder="∞" />
              </div>
              <div className="space-y-1">
                <Label>Máx. órdenes/mes</Label>
                <Input {...register("maxOrdersMonth", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} type="number" placeholder="∞" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Stripe Price ID</Label>
                <Input {...register("stripePriceId")} placeholder="price_xxx" />
              </div>
              <div className="col-span-2 md:col-span-3 flex gap-2 pt-1">
                <Button type="submit" disabled={loading} size="sm">Crear</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setCreating(false); reset() }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Mensual</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Comision directa</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Productos</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Pedidos/mes</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Estado</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/40">
                    {editingId === plan.id ? (
                      <td colSpan={7} className="p-4">
                        <form onSubmit={handleEdit(onEdit)} className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          <div className="space-y-1 col-span-2 md:col-span-1">
                            <Label>Nombre</Label>
                            <Input {...regEdit("name")} />
                            {errEdit.name && <p className="text-xs text-destructive">{errEdit.name.message}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label>Slug</Label>
                            <Input {...regEdit("slug")} disabled className="bg-muted" />
                          </div>
                          <div className="space-y-1">
                            <Label>Mensual</Label>
                            <Input {...regEdit("priceMonthly", { valueAsNumber: true })} type="number" step="0.01" />
                          </div>
                          <div className="space-y-1">
                            <Label>Comision venta directa (%)</Label>
                            <Input {...regEdit("commissionPercent", { valueAsNumber: true })} type="number" step="0.01" min="0" max="100" />
                          </div>
                          <div className="space-y-1">
                            <Label>Máx. productos</Label>
                            <Input {...regEdit("maxProducts", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} type="number" placeholder="∞" />
                          </div>
                          <div className="space-y-1">
                            <Label>Máx. órdenes/mes</Label>
                            <Input {...regEdit("maxOrdersMonth", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} type="number" placeholder="∞" />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <Label>Stripe Price ID</Label>
                            <Input {...regEdit("stripePriceId")} placeholder="price_xxx" />
                          </div>
                          <div className="col-span-2 md:col-span-3 flex gap-2 pt-1">
                            <Button type="submit" size="sm" disabled={loading}><Check className="h-3 w-3 mr-1" />Guardar</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="p-4">
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">{plan.slug}</p>
                        </td>
                        <td className="p-4 text-right tabular-nums">{formatPrice(plan.priceMonthly)}</td>
                        <td className="p-4 text-center tabular-nums">{(plan.commissionRate * 100).toFixed(2)}%</td>
                        <td className="p-4 text-center">{plan.maxProducts ?? "∞"}</td>
                        <td className="p-4 text-center">{plan.maxOrdersMonth ?? "∞"}</td>
                        <td className="p-4 text-center">
                          <Badge variant={plan.isActive ? "default" : "secondary"}>
                            {plan.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(plan)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActive(plan)}>
                              {plan.isActive ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deletePlan(plan)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay planes creados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
