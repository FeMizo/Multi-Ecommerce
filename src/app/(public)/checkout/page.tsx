"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCartStore } from "@/stores/cart"
import { formatPrice } from "@/lib/utils"

const schema = z.object({
  fullName: z.string().min(3, "Nombre requerido"),
  phone: z.string().min(9, "Teléfono inválido"),
  address: z.string().min(5, "Dirección requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    if (items.length === 0) return
    setLoading(true)

    const storeId = items[0]?.storeId
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, storeId, shippingAddress: data }),
    })

    setLoading(false)

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al procesar el pago")
      return
    }

    const { url } = await res.json()
    if (url) {
      window.location.href = url
    }
  }

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader><CardTitle>Datos de entrega</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label>Nombre completo</Label>
                    <Input {...register("fullName")} />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Teléfono</Label>
                    <Input {...register("phone")} placeholder="987 654 321" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Ciudad</Label>
                    <Input {...register("city")} />
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Dirección</Label>
                    <Input {...register("address")} placeholder="Av. Los Olivos 123, Dpto 4B" />
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Notas (opcional)</Label>
                    <Input {...register("notes")} placeholder="Instrucciones para el delivery" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-20">
              <CardHeader><CardTitle>Tu pedido</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total())}</span>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Procesando..." : "Pagar con Stripe"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Pago seguro · Tu dinero está protegido
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
