"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { toast } from "sonner"
import { Banknote, CheckCircle2, CreditCard, Landmark, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCartStore } from "@/stores/cart"
import { formatPrice } from "@/lib/utils"
import { DeliveryLocationPicker } from "@/components/checkout/delivery-location-picker"
import {
  DELIVERY_METHOD_DESCRIPTIONS,
  DELIVERY_METHOD_LABELS,
  type DeliveryLocationDraft,
  type DeliveryMethodValue,
} from "@/lib/delivery"
import {
  PAYMENT_METHOD_DESCRIPTIONS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodValue,
} from "@/lib/payment-methods"

const schema = z.object({
  fullName: z.string().min(3, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  phone: z.string().min(9, "Teléfono inválido"),
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

const DELIVERY_METHODS: DeliveryMethodValue[] = ["PICKUP", "LOCAL_DELIVERY"]

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkoutToken] = useState(() => crypto.randomUUID())
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [storeOptions, setStoreOptions] = useState<StoreOptions | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("CASH_ON_DELIVERY")
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodValue>("PICKUP")
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocationDraft>({
    formattedAddress: "",
    lat: null,
    lng: null,
    notes: "",
  })
  const [couponCode, setCouponCode] = useState("")
  const profilePrefilled = useRef(false)
  const checkoutStoreId = items[0]?.storeId ?? null
  const checkoutStoreName = items[0]?.storeName ?? null
  const checkoutItems = useMemo(() => {
    if (!checkoutStoreId) return []
    return items.filter((item) => item.storeId === checkoutStoreId)
  }, [checkoutStoreId, items])
  const checkoutTotal = useMemo(
    () => checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [checkoutItems]
  )
  const profileLoading = status === "authenticated" && !profileReady

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (status !== "authenticated" || profilePrefilled.current) return

    fetch("/api/account/profile")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message ?? "No se pudo cargar tu perfil")
        return data as { name?: string | null; email?: string | null; phone?: string | null }
      })
      .then((user) => {
        reset({
          fullName: user.name ?? session?.user?.name ?? "",
          email: user.email ?? session?.user?.email ?? "",
          phone: user.phone ?? "",
          city: "",
          notes: "",
        })
        profilePrefilled.current = true
      })
      .catch(() => {
        reset({
          fullName: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
          phone: "",
          city: "",
          notes: "",
        })
        profilePrefilled.current = true
      })
      .finally(() => {
        setProfileReady(true)
      })
  }, [reset, session?.user?.email, session?.user?.name, status])

  useEffect(() => {
    if (!checkoutStoreId) return

    const controller = new AbortController()

    fetch(`/api/stores?storeId=${checkoutStoreId}`, { signal: controller.signal })
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
  }, [checkoutStoreId])

  async function onSubmit(data: FormData) {
    if (checkoutItems.length === 0 || !checkoutStoreId) return
    if (deliveryMethod === "LOCAL_DELIVERY" && (!deliveryLocation.formattedAddress.trim() || deliveryLocation.lat === null || deliveryLocation.lng === null)) {
      toast.error("Selecciona una ubicación válida")
      return
    }

    setLoading(true)

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkoutToken,
        items: checkoutItems,
        storeId: checkoutStoreId,
        paymentMethod: selectedPaymentMethod,
        deliveryMethod,
        deliveryLocation: deliveryMethod === "LOCAL_DELIVERY" ? deliveryLocation : null,
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

  const hasPendingItems = checkoutItems.length !== items.length
  const canUseStripe = Boolean(storeOptions?.stripeOnboarded)
  const canUseCashOnDelivery = Boolean(storeOptions?.cashOnDeliveryEnabled)
  const canUseTransfer = Boolean(storeOptions?.transferEnabled)
  const availablePaymentMethods = ([] as PaymentMethodValue[]).concat(
    canUseCashOnDelivery ? ["CASH_ON_DELIVERY"] : [],
    canUseTransfer ? ["TRANSFER"] : [],
    canUseStripe ? ["STRIPE"] : [],
  )
  const hasAnyPayment = availablePaymentMethods.length > 0
  const selectedPaymentMethod = hasAnyPayment && !availablePaymentMethods.includes(paymentMethod)
    ? availablePaymentMethods[0]
    : paymentMethod
  const deliveryReady = deliveryMethod === "PICKUP" || (
    deliveryLocation.formattedAddress.trim().length > 0 &&
    deliveryLocation.lat !== null &&
    deliveryLocation.lng !== null
  )

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/cart")
    }
  }, [items.length, mounted, router])

  if (!mounted || items.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      {items.length > 1 && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          Solo se tomara la tienda del primer producto del carrito. Los demas productos se quedaran guardados.
        </div>
      )}
      {hasPendingItems && checkoutStoreName && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Solo se procesarán los productos de {checkoutStoreName}. Los demás seguirán en tu carrito.
        </div>
      )}
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
                  <div className="col-span-2 space-y-1">
                    <Label>Correo electrónico</Label>
                    <Input
                      {...register("email")}
                      readOnly={status === "authenticated"}
                      className={status === "authenticated" ? "bg-muted" : undefined}
                      placeholder="tu@correo.com"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
                    <Label>Notas (opcional)</Label>
                    <Input {...register("notes")} placeholder="Instrucciones adicionales" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Método de entrega</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {DELIVERY_METHODS.map((method) => {
                  const selected = deliveryMethod === method

                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDeliveryMethod(method)}
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
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold">{DELIVERY_METHOD_LABELS[method]}</p>
                            {selected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Seleccionado
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{DELIVERY_METHOD_DESCRIPTIONS[method]}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {deliveryMethod === "PICKUP" ? (
                  <p className="text-xs text-muted-foreground">
                    No se mostrará ninguna dirección. El cliente recogerá el pedido en la tienda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Selecciona una dirección con Google Maps. La ubicación se guardará con el pedido.
                    </p>
                    <DeliveryLocationPicker
                      value={deliveryLocation}
                      onChange={setDeliveryLocation}
                      disabled={loading}
                    />
                    {!deliveryReady && (
                      <p className="text-xs text-destructive">
                        Selecciona una ubicación válida para continuar.
                      </p>
                    )}
                  </div>
                )}
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
                      const selected = selectedPaymentMethod === method

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
                    {selectedPaymentMethod === "CASH_ON_DELIVERY" && (
                      <p className="text-xs text-muted-foreground">
                        Se mostrará como pago contra entrega en el pedido.
                      </p>
                    )}
                    {selectedPaymentMethod === "TRANSFER" && (
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
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(checkoutTotal)}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || optionsLoading || profileLoading || !hasAnyPayment || checkoutItems.length === 0 || !deliveryReady}
                >
                  {loading
                    ? "Procesando..."
                    : selectedPaymentMethod === "CASH_ON_DELIVERY"
                      ? "Confirmar pedido"
                      : selectedPaymentMethod === "TRANSFER"
                        ? "Generar código de transferencia"
                        : "Pagar con Stripe"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {selectedPaymentMethod === "CASH_ON_DELIVERY"
                    ? "Cobro al entregar · La tienda asume el riesgo"
                    : selectedPaymentMethod === "TRANSFER"
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
