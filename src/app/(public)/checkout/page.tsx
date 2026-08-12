"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { toast } from "sonner"
import { Banknote, CheckCircle2, CreditCard, Landmark, ShieldCheck } from "lucide-react"
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
  email: z.string().email("Correo invalido"),
  phone: z.string().min(9, "Telefono invalido"),
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
  const { data: session, status } = useSession()
  const { items } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [checkoutToken] = useState(() => crypto.randomUUID())
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [storeOptions, setStoreOptions] = useState<StoreOptions | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("CASH_ON_DELIVERY")
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
        if (!res.ok) throw new Error(data.message ?? "No se pudieron cargar los metodos de pago")
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

    setLoading(true)

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkoutToken,
        items: checkoutItems,
        storeId: checkoutStoreId,
        paymentMethod: selectedPaymentMethod,
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

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 surface-grid opacity-35" />
      <div className="container mx-auto max-w-6xl px-4 py-8 relative">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Checkout</p>
            <h1 className="editorial-title mt-2 text-4xl md:text-5xl">Un cierre simple y confiable.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Menos pasos, más claridad y señales visibles de confianza para que el usuario termine la compra sin dudas.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-border/60 bg-background/90 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Pago seguro y datos protegidos
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              El formulario auto-completa el perfil si estás autenticado y muestra sólo los métodos de pago disponibles.
            </p>
          </div>
        </div>

        {items.length > 1 && (
          <div className="mb-6 rounded-3xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-primary">
            Solo se tomará la tienda del primer producto del carrito. Los demás productos se quedarán guardados.
          </div>
        )}

        {hasPendingItems && checkoutStoreName && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Solo se procesarán los productos de {checkoutStoreName}. Los demás seguirán en tu carrito.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Datos del cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Nombre completo</Label>
                      <Input {...register("fullName")} />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Correo electrónico</Label>
                      <Input
                        {...register("email")}
                        readOnly={status === "authenticated"}
                        className={status === "authenticated" ? "bg-muted" : undefined}
                        placeholder="tu@correo.com"
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Teléfono</Label>
                      <Input {...register("phone")} placeholder="987 654 321" />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ciudad</Label>
                      <Input {...register("city")} />
                      {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Notas opcionales</Label>
                      <Input {...register("notes")} placeholder="Instrucciones adicionales" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Método de pago</CardTitle>
                </CardHeader>
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
                            className={`w-full rounded-3xl border px-4 py-4 text-left transition-all ${
                              selected
                                ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                : "border-border hover:bg-accent/60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
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
                        <p className="text-sm text-destructive">Esta tienda no tiene métodos de pago disponibles.</p>
                      )}
                      {selectedPaymentMethod === "CASH_ON_DELIVERY" && (
                        <p className="text-xs text-muted-foreground">Se mostrará como pago contra entrega en el pedido.</p>
                      )}
                      {selectedPaymentMethod === "TRANSFER" && (
                        <p className="text-xs text-muted-foreground">Mostraremos los datos bancarios, el código y la referencia al finalizar.</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Cupón</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
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

            <div className="space-y-6">
              <Card className="sticky top-20 rounded-[1.75rem] border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Tu pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(checkoutTotal)}</span>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Revisamos método de pago, datos del cliente y disponibilidad antes de enviar el pedido.
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full text-base btn-shine"
                    size="lg"
                    disabled={loading || optionsLoading || profileLoading || !hasAnyPayment || checkoutItems.length === 0}
                  >
                    {loading
                      ? "Procesando..."
                      : selectedPaymentMethod === "CASH_ON_DELIVERY"
                        ? "Confirmar pedido"
                        : selectedPaymentMethod === "TRANSFER"
                          ? "Generar código de transferencia"
                          : "Pagar con Stripe"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
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
    </div>
  )
}
