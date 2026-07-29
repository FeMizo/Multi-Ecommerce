"use client"

import { useEffect, useState } from "react"
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
import {
  PAYMENT_METHOD_DESCRIPTIONS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodValue,
} from "@/lib/payment-methods"

const schema = z.object({
  fullName: z.string().min(3, "Nombre requerido"),
  phone: z.string().min(9, "Telefono invalido"),
  address: z.string().min(5, "Direccion requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type StoreOptions = {
  cashOnDeliveryEnabled: boolean
  stripeOnboarded: boolean
  transferEnabled: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [checkoutToken] = useState(() => crypto.randomUUID())
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [storeOptions, setStoreOptions] = useState<StoreOptions | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("STRIPE")
  const [couponCode, setCouponCode] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const storeId = items[0]?.storeId
    if (!storeId) return

    const controller = new AbortController()

    fetch(`/api/stores?storeId=${storeId}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message ?? "No se pudieron cargar los metodos de pago")
        return data as StoreOptions
      })
      .then((data) => {
        setStoreOptions(data)
        setPaymentMethod(
          data.stripeOnboarded
            ? "STRIPE"
            : data.cashOnDeliveryEnabled
              ? "CASH_ON_DELIVERY"
              : "TRANSFER"
        )
      })
      .catch(() => {
        setStoreOptions(null)
      })
      .finally(() => {
        setOptionsLoading(false)
      })

    return () => controller.abort()
  }, [items])

  async function onSubmit(data: FormData) {
    if (items.length === 0) return
    setLoading(true)

    const storeId = items[0]?.storeId
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkoutToken,
        items,
        storeId,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
        shippingAddress: data,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al procesar el pago")
      return
    }

    const { url } = await res.json()
    if (url) {
      window.location.assign(url)
    }
  }

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  const canUseStripe = Boolean(storeOptions?.stripeOnboarded)
  const canUseCashOnDelivery = Boolean(storeOptions?.cashOnDeliveryEnabled)
  const canUseTransfer = Boolean(storeOptions?.transferEnabled)
  const hasAnyPayment = canUseStripe || canUseCashOnDelivery || canUseTransfer

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
                    <Label>Telefono</Label>
                    <Input {...register("phone")} placeholder="987 654 321" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Ciudad</Label>
                    <Input {...register("city")} />
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Direccion</Label>
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

            <Card>
              <CardHeader><CardTitle>Metodo de pago</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {optionsLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando metodos de pago...</p>
                ) : (
                  <>
                    {canUseCashOnDelivery && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          paymentMethod === "CASH_ON_DELIVERY" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                        }`}
                      >
                        <p className="font-medium">{PAYMENT_METHOD_LABELS.CASH_ON_DELIVERY}</p>
                        <p className="text-xs text-muted-foreground">{PAYMENT_METHOD_DESCRIPTIONS.CASH_ON_DELIVERY}</p>
                      </button>
                    )}
                    {canUseStripe && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("STRIPE")}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          paymentMethod === "STRIPE" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                        }`}
                      >
                        <p className="font-medium">{PAYMENT_METHOD_LABELS.STRIPE}</p>
                        <p className="text-xs text-muted-foreground">{PAYMENT_METHOD_DESCRIPTIONS.STRIPE}</p>
                      </button>
                    )}
                    {canUseTransfer && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("TRANSFER")}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          paymentMethod === "TRANSFER" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                        }`}
                      >
                        <p className="font-medium">{PAYMENT_METHOD_LABELS.TRANSFER}</p>
                        <p className="text-xs text-muted-foreground">{PAYMENT_METHOD_DESCRIPTIONS.TRANSFER}</p>
                      </button>
                    )}
                    {!hasAnyPayment && (
                      <p className="text-sm text-destructive">
                        Esta tienda no tiene metodos de pago disponibles.
                      </p>
                    )}
                    {paymentMethod === "CASH_ON_DELIVERY" && (
                      <p className="text-xs text-muted-foreground">
                        Se mostrara como pago contra entrega en el pedido.
                      </p>
                    )}
                    {paymentMethod === "TRANSFER" && (
                      <p className="text-xs text-muted-foreground">
                        Te mostraremos los datos bancarios, el codigo de transferencia y la referencia al finalizar.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Cupon</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Codigo de cupon</Label>
                  <Input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="AHORRA10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Si el cupón es válido para esta tienda, se aplicará al confirmar el pedido.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-20">
              <CardHeader><CardTitle>Tu pedido</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total())}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || optionsLoading || !hasAnyPayment}
                >
                  {loading
                    ? "Procesando..."
                    : paymentMethod === "CASH_ON_DELIVERY"
                      ? "Confirmar pedido"
                      : paymentMethod === "TRANSFER"
                        ? "Generar codigo de transferencia"
                        : "Pagar con Stripe"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {paymentMethod === "CASH_ON_DELIVERY"
                    ? "Cobro al entregar · La tienda asume el riesgo"
                    : paymentMethod === "TRANSFER"
                      ? "Pago transferencia · Usa el codigo de referencia"
                      : "Pago seguro · Tu dinero esta protegido"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
