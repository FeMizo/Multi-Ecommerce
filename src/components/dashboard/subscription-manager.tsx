"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

type Plan = {
  id: string
  name: string
  priceMonthly: number
  maxProducts: number | null
  maxOrdersMonth: number | null
  availableInStripe: boolean
}

type Subscription = {
  planId: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
} | null

export function SubscriptionManager({
  storeSlug,
  plans,
  subscription,
  isOwner,
}: {
  storeSlug: string
  plans: Plan[]
  subscription: Subscription
  isOwner: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)

  async function openBilling(action: "checkout" | "portal", planId?: string) {
    setLoading(planId ?? action)
    const res = await fetch(`/api/stores/${storeSlug}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, planId }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok || !data.url) return toast.error(data.message ?? "No se pudo abrir Stripe Billing")
    window.location.assign(data.url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Plan y facturación</CardTitle>
          {subscription && (
            <p className="mt-1 text-xs text-muted-foreground">
              Estado: {subscription.status}
              {subscription.currentPeriodEnd ? ` · Periodo hasta ${new Date(subscription.currentPeriodEnd).toLocaleDateString("es-MX")}` : ""}
              {subscription.cancelAtPeriodEnd ? " · Se cancelará al terminar el periodo" : ""}
            </p>
          )}
        </div>
        {subscription?.stripeSubscriptionId && (
          <Button type="button" variant="outline" disabled={!isOwner || loading !== null} onClick={() => openBilling("portal")}>
            {loading === "portal" ? "Abriendo..." : "Administrar facturación"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const current = subscription?.planId === plan.id && ["ACTIVE", "TRIALING"].includes(subscription.status)
          return (
            <div key={plan.id} className={`rounded-lg border p-4 ${current ? "border-primary" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{plan.name}</p>
                {current && <Badge>Actual</Badge>}
              </div>
              <p className="mt-2 text-2xl font-bold">{formatPrice(plan.priceMonthly)}<span className="text-xs font-normal text-muted-foreground">/mes</span></p>
              <p className="mt-3 text-xs text-muted-foreground">
                {plan.maxProducts ?? "Productos ilimitados"} {plan.maxProducts !== null ? "productos" : ""}<br />
                {plan.maxOrdersMonth ?? "Pedidos ilimitados"} {plan.maxOrdersMonth !== null ? "pedidos/mes" : ""}
              </p>
              {!current && plan.availableInStripe && (
                <Button
                  type="button"
                  className="mt-4 w-full"
                  size="sm"
                  disabled={!isOwner || loading !== null}
                  onClick={() => subscription?.stripeSubscriptionId ? openBilling("portal") : openBilling("checkout", plan.id)}
                >
                  {loading === plan.id || loading === "portal" ? "Abriendo..." : subscription?.stripeSubscriptionId ? "Cambiar en Stripe" : "Elegir plan"}
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
