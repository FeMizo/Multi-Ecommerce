import Link from "next/link"
import type { Metadata } from "next"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { buildKeywords } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Planes y precios",
  description: "Planes para vendedores de AionSite Shop con limites y comision por venta directa.",
  keywords: buildKeywords("Planes y precios", ["planes para tiendas", "precios para vendedores", "suscripciones"]),
  alternates: { canonical: "/plans" },
}

export default async function PlansPage() {
  const session = await auth()
  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
    select: {
      id: true,
      name: true,
      priceMonthly: true,
      maxProducts: true,
      maxOrdersMonth: true,
      commissionRate: true,
    },
  })
  const membership = session?.user?.id
    ? await db.storeMember.findFirst({
        where: { userId: session.user.id, role: "OWNER" },
        orderBy: { createdAt: "asc" },
        select: { store: { select: { slug: true } } },
      })
    : null

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Planes y precios</h1>
        <p className="text-muted-foreground text-lg">
          Elige el plan para tu tienda. La comision aplica solo en ventas directas pagadas en la pagina.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const href = membership
            ? `/dashboard/${membership.store.slug}/settings`
            : session?.user?.id
              ? `/onboarding?planId=${plan.id}`
              : `/register?planId=${plan.id}`

          return (
            <div key={plan.id} className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold text-lg">{plan.name}</h2>
              <p className="mt-3 text-3xl font-bold">
                {formatPrice(plan.priceMonthly)}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {plan.maxProducts ?? "Productos ilimitados"} {plan.maxProducts !== null ? "productos" : ""}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {plan.maxOrdersMonth ?? "Pedidos ilimitados"} {plan.maxOrdersMonth !== null ? "pedidos/mes" : ""}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {(plan.commissionRate * 100).toFixed(2)}% por venta directa
                </li>
              </ul>
              <Button className="mt-6 w-full" asChild>
                <Link href={href}>Adquirir</Link>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
