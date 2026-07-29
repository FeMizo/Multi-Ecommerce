"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Banknote, CheckCircle2, CreditCard, Landmark } from "lucide-react"
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
  phone: z.string().min(9, "Teléfono inválido"),
  address: z.string().min(5, "Dirección requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type StoreOptions = {
  cashOnDeliveryEnabled: boolean
  stripeOnboarded: boolean
  transferEnabled: boolean
}

type PaymentMethodCard = {
  value: PaymentMethodValue
  label: string
  description: string
  icon: typeof CreditCard
}

const PAYMENT_METHOD_CARDS: Record<PaymentMethodValue, PaymentMethodCard> = {
  STRIPE: {
    value: "STRIPE",
    label: PAYMENT_METHOD_LABELS.STRIPE,
    description: PAYMENT_METHOD_DESCRIPTIONS.STRIPE,
    icon: CreditCard,
  },
  CASH_ON_DELIVERY: {
    value: "CASH_ON_DELIVERY",
    label: PAYMENT_METHOD_LABELS.CASH_ON_DELIVERY,
    description: PAYMENT_METHOD_DESCRIPTIONS.CASH_ON_DELIVERY,
    icon: Banknote,
  },
  TRANSFER: {
    value: "TRANSFER",
    label: PAYMENT_METHOD_LABELS.TRANSFER,
    description: PAYMENT_METHOD_DESCRIPTIONS.TRANSFER,
    icon: Landmark,
  },
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [checkoutToken] = useState(() => crypto.randomUUID())
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [storeOptions, setStoreOptions] = useState<StoreOptions | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("CASH_ON_DELIVERY")
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
        if (!res.ok) throw new Error(data.message ?? "No se pudieron cargar los métodos de pago")
        return data as StoreOptions
      })
      .then((data) => {
        setStoreOptions(data)
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
        customerInfo: data,
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
  const availablePaymentMethods = ([] as PaymentMethodValue[]).concat(
    canUseCashOnDelivery ? ["CASH_ON_DELIVERY"] : [],
    canUseTransfer ? ["TRANSFER"] : [],
    canUseStripe ? ["STRIPE"] : [],
  )
  const hasAnyPayment = availablePaymentMethods.length > 0

  useEffect(() => {
    if (!hasAnyPayment) return
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0])
    }
  }, [availablePaymentMethods, hasAnyPayment, paymentMethod])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader><CardTitle>Datos del cliente</CardTitle></CardHeader>
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
                    <Input {...register("notes")} placeholder="Instrucciones adicionales" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Método de pago</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {optionsLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando métodos de pago...</p>
                ) : (
                  <>
                    {availablePaymentMethods.map((method) => {
                      const card = PAYMENT_METHOD_CARDS[method]
                      const Icon = card.icon
                      const selected = paymentMethod === method

                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                              : "border-border hover:bg-accent/60"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">{card.label}</p>
                                {selected && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Seleccionado
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {!hasAnyPayment && (
                      <p className="text-sm text-destructive">
                        Esta tienda no tiene métodos de pago disponibles.
                      </p>
                    )}
                    {paymentMethod === "CASH_ON_DELIVERY" && (
                      <p className="text-xs text-muted-foreground">
                        Se mostrará como pago contra entrega en el pedido.
                      </p>
                    )}
                    {paymentMethod === "TRANSFER" && (
                      <p className="text-xs text-muted-foreground">
                        Te mostraremos los datos bancarios, el código de transferencia y la referencia al finalizar.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Cupón</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Código de cupón</Label>
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
                  <div key={item.id} className="flex justify-between text-sm">
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
                        ? "Generar código de transferencia"
                        : "Pagar con Stripe"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {paymentMethod === "CASH_ON_DELIVERY"
                    ? "Cobro al entregar · La tienda asume el riesgo"
                    : paymentMethod === "TRANSFER"
                      ? "Pago por transferencia · Usa el código de referencia"
                      : "Pago seguro · Tu dinero está protegido"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}



