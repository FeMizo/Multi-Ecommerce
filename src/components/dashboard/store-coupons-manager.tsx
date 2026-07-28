"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Coupon = {
  id: string
  code: string
  name: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  minOrderAmount: number | null
  maxRedemptions: number | null
  redeemedCount: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

type Props = {
  storeSlug: string
  coupons: Coupon[]
}

function formatCouponValue(coupon: Coupon) {
  return coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value.toFixed(2)} MXN`
}

export function StoreCouponsManager({ storeSlug, coupons: initialCoupons }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coupons, setCoupons] = useState(initialCoupons)
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE")

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setLoading(true)
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      code: String(formData.get("code") ?? "").trim(),
      type,
      value: Number(formData.get("value") ?? 0),
      minOrderAmount: formData.get("minOrderAmount") ? Number(formData.get("minOrderAmount")) : null,
      maxRedemptions: formData.get("maxRedemptions") ? Number(formData.get("maxRedemptions")) : null,
      startsAt: String(formData.get("startsAt") ?? "").trim() ? new Date(String(formData.get("startsAt"))).toISOString() : null,
      endsAt: String(formData.get("endsAt") ?? "").trim() ? new Date(String(formData.get("endsAt"))).toISOString() : null,
    }

    const res = await fetch(`/api/stores/${storeSlug}/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      toast.error(data.message ?? "No se pudo crear el cupón")
      return
    }

    toast.success("Cupón creado")
    setCoupons((current) => [data.coupon as Coupon, ...current])
    form.reset()
    setType("PERCENTAGE")
    router.refresh()
  }

  async function removeCoupon(couponId: string) {
    setLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/coupons/${couponId}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      toast.error(data.message ?? "No se pudo eliminar el cupón")
      return
    }

    toast.success("Cupón eliminado")
    setCoupons((current) => current.filter((coupon) => coupon.id !== couponId))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo cupón</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCoupon} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>Nombre</Label>
              <Input name="name" placeholder="10% de descuento" required />
            </div>
            <div className="space-y-1">
              <Label>Código</Label>
              <Input name="code" placeholder="AHORRA10" required />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <select
                name="type"
                value={type}
                onChange={(event) => setType(event.target.value as "PERCENTAGE" | "FIXED")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FIXED">Monto fijo</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Valor</Label>
              <Input name="value" type="number" min="0" step="0.01" required />
            </div>
            <div className="space-y-1">
              <Label>Total mínimo</Label>
              <Input name="minOrderAmount" type="number" min="0" step="0.01" placeholder="Opcional" />
            </div>
            <div className="space-y-1">
              <Label>Usos máximos</Label>
              <Input name="maxRedemptions" type="number" min="1" step="1" placeholder="Opcional" />
            </div>
            <div className="space-y-1">
              <Label>Inicio</Label>
              <Input name="startsAt" type="datetime-local" />
            </div>
            <div className="space-y-1">
              <Label>Fin</Label>
              <Input name="endsAt" type="datetime-local" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Crear cupón"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {coupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{coupon.name}</p>
                  <code className="rounded bg-muted px-2 py-0.5 text-xs">{coupon.code}</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCouponValue(coupon)}
                  {coupon.minOrderAmount ? ` · mínimo ${coupon.minOrderAmount.toFixed(2)}` : ""}
                  {coupon.maxRedemptions ? ` · usos ${coupon.redeemedCount}/${coupon.maxRedemptions}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {coupon.isActive ? "Activo" : "Inactivo"}
                  {coupon.startsAt ? ` · inicia ${new Date(coupon.startsAt).toLocaleString("es-MX")}` : ""}
                  {coupon.endsAt ? ` · vence ${new Date(coupon.endsAt).toLocaleString("es-MX")}` : ""}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => removeCoupon(coupon.id)} disabled={loading}>
                Eliminar
              </Button>
            </CardContent>
          </Card>
        ))}

        {coupons.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Todavía no hay cupones para esta tienda.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
