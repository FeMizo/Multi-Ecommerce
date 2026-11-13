"use client"

import { StoreFulfillmentInfo, type StoreFulfillment } from "@/components/public/store-fulfillment"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { checkoutCustomerSchema } from "@/lib/checkout-customer"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import type { CheckoutQuote } from "@/lib/checkout-quote"
import { formatVariantSelection } from "@/lib/product-variants"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
import { plural } from "@/lib/plural"
import { Banknote, CreditCard, Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/stores/cart"
import { formatPrice } from "@/lib/utils"
import { DeliveryLocationPicker } from "@/components/checkout/delivery-location-picker"
import {
  DELIVERY_METHOD_LABELS,
  isLocalDeliveryConfigured,
  isValidDeliveryCoordinates,
  type DeliveryLocationDraft,
  type DeliveryMethodValue,
} from "@/lib/delivery"
import {
  PAYMENT_METHOD_DESCRIPTIONS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodValue,
} from "@/lib/payment-methods"

const schema = checkoutCustomerSchema

type FormData = z.infer<typeof schema>

type StoreOptions = StoreFulfillment & {
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

export default function CheckoutForm({ storeId }: { storeId: string | null }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const checkoutAttempt = useRef<{ fingerprint: string; token: string } | null>(null)
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
  const actionBarRef = useRef<HTMLDivElement>(null)
  const uniqueStores = [...new Set(items.map((item) => item.storeId))]
  const checkoutStoreId = storeId && uniqueStores.includes(storeId) ? storeId : !storeId && uniqueStores.length === 1 ? uniqueStores[0] : null
  const checkoutStoreName = items.find((item) => item.storeId === checkoutStoreId)?.storeName ?? null
  const checkoutItems = useMemo(() => {
    if (!checkoutStoreId) return []
    return items.filter((item) => item.storeId === checkoutStoreId)
  }, [checkoutStoreId, items])
  const checkoutTotal = useMemo(
    () => checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [checkoutItems]
  )
  const profileLoading = status === "authenticated" && !profileReady
  const showMapsErrorDetails = session?.user?.globalRole === "PLATFORM_ADMIN"

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
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
        if (controller.signal.aborted) return
        setStoreOptions(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false)
      })

    return () => controller.abort()
  }, [checkoutStoreId])

  async function onSubmit(data: FormData) {
    if (!canSubmit || !quote || !checkoutStoreId) return
    const fingerprint = JSON.stringify({ storeId: checkoutStoreId, items: checkoutItems, paymentMethod: selectedPaymentMethod, deliveryMethod, deliveryLocation: deliveryMethod === "LOCAL_DELIVERY" ? deliveryLocation : null, couponCode: quote.couponCode, total: quote.total, customerInfo: data })
    if (checkoutAttempt.current?.fingerprint !== fingerprint) checkoutAttempt.current = { fingerprint, token: crypto.randomUUID() }
    const checkoutToken = checkoutAttempt.current.token
    setLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutToken, items: checkoutItems, storeId: checkoutStoreId, paymentMethod: selectedPaymentMethod, deliveryMethod, deliveryLocation: deliveryMethod === "LOCAL_DELIVERY" ? deliveryLocation : null, couponCode: quote.couponCode ?? undefined, expectedTotal: quote.total, customerInfo: data }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (result.code === "TEST_CHECKOUT_EXPIRED") checkoutAttempt.current = null
        if (response.status === 409) setRevision((value) => value + 1)
        throw new Error(result.message ?? "No pudimos procesar tu pedido. Inténtalo de nuevo.")
      }
      if (!result.url) throw new Error("No recibimos la confirmación. Inténtalo de nuevo.")
      window.location.assign(result.url)
    } catch (error) {
      toast.error(error instanceof Error && !(error instanceof TypeError) ? error.message : "No hay conexión. Revisa tu red e inténtalo de nuevo.")
    } finally { setLoading(false) }
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
  const deliveryFee = deliveryMethod === "LOCAL_DELIVERY" ? storeOptions?.deliveryFee ?? 0 : 0
  const deliveryReady = deliveryMethod === "PICKUP" || (
    isLocalDeliveryConfigured(storeOptions) &&
    deliveryLocation.formattedAddress.trim().length >= 3 &&
    isValidDeliveryCoordinates(deliveryLocation.lat, deliveryLocation.lng)
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

  const [requestedCoupon, setRequestedCoupon] = useState("")
  const [revision, setRevision] = useState(0)
  const [quoteState, setQuoteState] = useState<{ key: string; quote?: CheckoutQuote; error?: string } | null>(null)
  const quotePayload = JSON.stringify({ storeId: checkoutStoreId, deliveryMethod, couponCode: requestedCoupon || undefined, items: checkoutItems.map((item) => ({ productId: item.productId, quantity: item.quantity, variantSelection: item.variantSelection })) })
  const quoteKey = quotePayload + ":" + revision
  useEffect(() => {
    if (!checkoutStoreId || !checkoutItems.length) return
    const controller = new AbortController()
    fetch("/api/checkout/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: quotePayload, signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message ?? "No pudimos calcular tu compra"); return data as CheckoutQuote })
      .then((quote) => { if (!controller.signal.aborted) setQuoteState({ key: quoteKey, quote }) })
      .catch((error) => { if (!controller.signal.aborted) setQuoteState({ key: quoteKey, error: error instanceof Error ? error.message : "No hay conexión. Inténtalo de nuevo." }) })
    return () => controller.abort()
  }, [checkoutStoreId, checkoutItems.length, quotePayload, quoteKey])
  const quote = quoteState?.key === quoteKey ? quoteState.quote : undefined
  const quoteError = quoteState?.key === quoteKey ? quoteState.error : undefined
  const normalizedCoupon = couponCode.trim().toUpperCase().replace(/\s+/g, "-")
  const couponPending = normalizedCoupon !== requestedCoupon
  const finalTotal = quote?.total ?? checkoutTotal + deliveryFee
  const blockedReason = optionsLoading || profileLoading ? "Estamos cargando los datos de tu compra." : !hasAnyPayment ? "Esta tienda no tiene métodos de pago disponibles." : !isValid ? "Completa nombre, correo, teléfono y ciudad para continuar." : !deliveryReady ? "Selecciona una ubicación válida y revisa la entrega local." : couponPending ? "Aplica o elimina el cupón antes de confirmar." : !quote ? quoteError ?? "Estamos calculando el total de tu compra." : ""
  const canSubmit = !loading && !blockedReason && Boolean(quote)
  const actionLabel = loading ? "Procesando…" : selectedPaymentMethod === "TRANSFER" ? "Generar referencia" : selectedPaymentMethod === "STRIPE" ? "Pagar con tarjeta (TEST)" : "Confirmar pedido"
  function applyCoupon() { setRequestedCoupon(normalizedCoupon); setRevision((value) => value + 1) }
  const priceBreakdown = <dl className="space-y-2 text-sm tabular-nums"><div className="flex justify-between gap-3"><dt>Productos</dt><dd>{formatPrice(quote?.subtotal ?? checkoutTotal)}</dd></div>{Boolean(quote?.discountAmount) && <div className="flex justify-between gap-3"><dt>Descuento ({quote?.couponCode})</dt><dd>−{formatPrice(quote?.discountAmount ?? 0)}</dd></div>}<div className="flex justify-between gap-3"><dt>{deliveryMethod === "PICKUP" ? "Recogida" : "Envío local"}</dt><dd>{deliveryMethod === "PICKUP" ? "Sin costo" : storeOptions?.deliveryFee == null ? "Sin configurar" : formatPrice(quote?.shippingFee ?? deliveryFee)}</dd></div><div className="flex justify-between gap-3 border-t pt-3 text-lg font-semibold"><dt>Total</dt><dd>{quote ? formatPrice(finalTotal) : "Calculando…"}</dd></div></dl>

  if (!mounted || !items.length) return null
  if (!checkoutStoreId) return <div className="container mx-auto max-w-2xl px-4 py-12"><h1 className="text-3xl font-semibold">Elige una tienda</h1><p className="my-4">Cada tienda procesa su pedido por separado. Tus demás productos seguirán guardados.</p><Button asChild><Link href="/cart">Elegir tienda en el carrito</Link></Button></div>
  return <div className="checkout-flow container mx-auto max-w-5xl px-4 pb-44 pt-6 lg:pb-12">
    <Link href="/cart" className="mb-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Volver al carrito</Link>
    <h1 className="mb-2 text-3xl font-semibold">Finalizar compra</h1>
    <p className="mb-6 text-sm text-muted-foreground">Compra como invitado. {hasPendingItems ? "Los productos de otras tiendas seguirán guardados." : "Revisa tus productos y elige cómo recibirlos."}</p>
    <form id="checkout-form" onFocusCapture={(event) => { const target = event.target; requestAnimationFrame(() => { if (!(target instanceof HTMLElement) || !window.matchMedia("(max-width: 1023px)").matches || actionBarRef.current?.contains(target)) return; const bounds = target.getBoundingClientRect(); const barTop = actionBarRef.current?.getBoundingClientRect().top ?? window.innerHeight; if (bounds.bottom > barTop - 16 || bounds.top < 80) target.scrollIntoView({ block: "center", behavior: "instant" }); }) }} noValidate onSubmit={(event) => { void handleSubmit(onSubmit)(event) }} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <aside aria-label="Resumen del pedido" className="rounded-xl border bg-card p-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:p-5">
        <h2 className="text-lg font-semibold">{checkoutStoreName}</h2><p className="mt-1 text-sm text-muted-foreground">{plural(checkoutItems.reduce((sum, item) => sum + item.quantity, 0), "producto")}</p>
        <ul className="my-4 space-y-4">{checkoutItems.map((item) => <li key={item.id} className="flex gap-3"><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted"><Image src={item.image || DEFAULT_PRODUCT_IMAGE} alt={item.name} fill sizes="48px" className="object-contain" /></div><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.name}</p>{item.variantSelection?.length > 0 && <p className="text-sm text-muted-foreground">{formatVariantSelection(item.variantSelection)}</p>}<p className="text-sm tabular-nums">{item.quantity} × {formatPrice(quote?.unitPrices?.[item.productId] ?? item.price)}</p></div></li>)}</ul>
        <div className="hidden border-t pt-4 lg:block">{priceBreakdown}</div>

      </aside>
      <div className="space-y-6 rounded-xl bg-card p-4 lg:col-start-1 lg:row-start-1 lg:p-6">
        <section aria-labelledby="customer-heading"><h2 id="customer-heading" className="mb-4 text-xl font-semibold">Tus datos</h2><div className="grid grid-cols-2 gap-4">
          {([{ name: "fullName", label: "Nombre completo", autoComplete: "name", type: "text" }, { name: "email", label: "Correo electrónico", autoComplete: "email", type: "email" }, { name: "phone", label: "Teléfono", autoComplete: "tel", type: "tel" }, { name: "city", label: "Ciudad", autoComplete: "address-level2", type: "text" }] as const).map((field) => <div key={field.name} className={field.name === "phone" || field.name === "city" ? "space-y-1" : "col-span-2 space-y-1"}><Label htmlFor={field.name}>{field.label}</Label><Input id={field.name} type={field.type} autoComplete={field.autoComplete} className="h-11" readOnly={field.name === "email" && status === "authenticated"} {...register(field.name)} aria-required="true" aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? field.name + "-error" : undefined} />{errors[field.name] && <p id={field.name + "-error"} role="alert" className="text-sm text-destructive">{errors[field.name]?.message}</p>}</div>)}
          <div className="col-span-2 space-y-1"><Label htmlFor="customer-notes">Notas (opcional)</Label><Input id="customer-notes" className="h-11" {...register("notes")} /></div>
        </div></section>
        <Separator />
        <fieldset><legend className="mb-3 text-xl font-semibold">Entrega</legend><div className="divide-y">{DELIVERY_METHODS.map((method) => <label key={method} className="flex min-h-14 cursor-pointer items-center gap-3 py-3"><input type="radio" name="delivery-method" value={method} checked={deliveryMethod === method} onChange={() => setDeliveryMethod(method)} className="h-5 w-5 accent-primary" /><span className="flex-1 font-medium">{DELIVERY_METHOD_LABELS[method]}</span><span className="text-sm">{method === "PICKUP" ? "Sin costo" : optionsLoading ? "Consultando…" : storeOptions?.deliveryFee == null ? "Sin configurar" : formatPrice(storeOptions.deliveryFee)}</span></label>)}</div>
          <div className="mt-3">{optionsLoading ? <p role="status" className="text-sm">Consultando datos de entrega…</p> : deliveryMethod === "PICKUP" ? <StoreFulfillmentInfo store={storeOptions ?? {}} pickup plain /> : <div className="space-y-4"><StoreFulfillmentInfo store={storeOptions ?? {}} plain />{storeOptions?.latitude != null && storeOptions.longitude != null ? <DeliveryLocationPicker storeCenter={{ lat: storeOptions.latitude, lng: storeOptions.longitude }} value={deliveryLocation} onChange={setDeliveryLocation} disabled={loading} showErrorDetails={showMapsErrorDetails} /> : <p role="status">La tienda aún no configura su ubicación para entrega local.</p>}</div>}</div>
        </fieldset>
        <Separator />
        <fieldset><legend className="mb-3 text-xl font-semibold">Pago</legend>{!canUseStripe && !optionsLoading && <label className="flex min-h-14 items-start gap-3 py-3 text-muted-foreground"><input type="radio" disabled className="mt-1 h-5 w-5 shrink-0" name="payment-method" /><span><span className="block font-medium">Tarjeta (TEST)</span><span className="text-sm">Pendiente configurar Stripe TEST. Sin cargos reales.</span></span></label>}{optionsLoading ? <p role="status">Cargando métodos de pago…</p> : <div className="divide-y">{availablePaymentMethods.map((method) => <label key={method} className="flex min-h-14 cursor-pointer items-start gap-3 py-3"><input type="radio" className="mt-1 h-5 w-5 shrink-0 accent-primary" name="payment-method" value={method} checked={selectedPaymentMethod === method} onChange={() => setPaymentMethod(method)} /><span><span className="block font-medium">{PAYMENT_METHOD_CARDS[method].label}</span><span className="text-sm text-muted-foreground">{method === "CASH_ON_DELIVERY" ? "Pagas al recibir tu pedido." : PAYMENT_METHOD_CARDS[method].description}</span></span></label>)}</div>}</fieldset>
        <Separator />
        <details><summary className="flex min-h-11 cursor-pointer items-center font-medium">{quote?.couponCode ? "Cupón aplicado: " + quote.couponCode : "Añadir cupón (opcional)"}</summary><div className="space-y-2 pb-3 pt-2"><Label htmlFor="coupon-code">Código de cupón</Label><div className="flex gap-2"><Input id="coupon-code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyCoupon() } }} className="h-11" autoComplete="off" aria-describedby="coupon-feedback" /><Button type="button" className="min-h-11" onClick={applyCoupon}>Aplicar</Button></div><p id="coupon-feedback" role="status" className="text-sm">{couponPending ? "Aplica el código para revisar el descuento antes de confirmar." : quoteError ?? (quote?.couponCode ? "Descuento incluido en el total." : "El descuento se mostrará antes de confirmar.")}</p>{(couponCode || requestedCoupon) && <Button type="button" variant="ghost" className="min-h-11" onClick={() => { setCouponCode(""); setRequestedCoupon("") }}>Eliminar cupón</Button>}</div></details>
        <div className="border-t pt-4 lg:hidden">{priceBreakdown}</div>
        {quoteError && <div role="alert" className="space-y-2 text-sm"><p>{quoteError}</p><Button type="button" variant="outline" className="min-h-11" onClick={() => setRevision((value) => value + 1)}>Recalcular total</Button></div>}
        <div ref={actionBarRef} className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto max-w-5xl"><p id="checkout-status" role="status" className="mb-2 text-sm">{loading ? "Procesando tu pedido…" : blockedReason || "Datos completos. Revisa el total antes de confirmar."}</p><div className="flex items-center gap-4"><div className="min-w-0 shrink-0 lg:hidden"><span className="block text-xs">Total MXN</span><strong className="text-lg tabular-nums" aria-live="polite">{quote ? formatPrice(finalTotal) : "Calculando…"}</strong></div><Button type="submit" className="min-h-12 flex-1 whitespace-normal px-4 py-3" disabled={!canSubmit} aria-describedby="checkout-status">{actionLabel}</Button></div></div>
        </div>
      </div>
    </form>
  </div>
}
