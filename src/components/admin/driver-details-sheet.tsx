"use client"

import { Phone, Store, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { DRIVER_STATUS_LABELS } from "@/lib/delivery"
import { formatPrice } from "@/lib/utils"

type DriverMetric = {
  label: string
  value: number
}

type DriverStore = {
  name: string
  slug: string
}

type DriverDelivery = {
  id: string
  status: string
  orderId: string
  orderTotal: number
  customerName: string
  storeName: string
  createdAtLabel: string
}

export type AdminDriverDetails = {
  id: string
  name: string
  email: string
  phone: string
  plate: string
  licenseNumber: string
  notes: string | null
  status: string
  scopeLabel: string
  primaryStore: DriverStore | null
  stores: DriverStore[]
  metrics: DriverMetric[]
  recentDeliveries: DriverDelivery[]
}

type Props = {
  driver: AdminDriverDetails
}

export function DriverDetailsSheet({ driver }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{driver.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{driver.phone}</p>
            </div>
            <Badge variant={driver.status === "AVAILABLE" ? "default" : "secondary"}>
              {DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS] ?? driver.status}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>{driver.scopeLabel}</span>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92vw] overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="mb-6 pr-8 text-left">
          <SheetTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            {driver.name}
          </SheetTitle>
          <SheetDescription>{driver.scopeLabel}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={driver.status === "AVAILABLE" ? "default" : "secondary"}>
              {DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS] ?? driver.status}
            </Badge>
            <Badge variant="outline">{driver.primaryStore ? driver.primaryStore.name : "General"}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacto</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{driver.name}</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {driver.phone || "Sin telefono"}
                </p>
                <p>{driver.email}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Unidad</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>Placa: {driver.plate || "Sin placa"}</p>
                <p>Licencia: {driver.licenseNumber || "Sin licencia"}</p>
                {driver.notes && <p>Notas: {driver.notes}</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {driver.metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border bg-card p-3">
                <p className="text-2xl font-bold tabular-nums">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tiendas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {driver.stores.length > 0 ? (
                driver.stores.map((store) => (
                  <Badge key={store.slug} variant="outline">
                    {store.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Disponible para cualquier tienda.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedidos recientes</p>
              <span className="text-xs text-muted-foreground">{driver.recentDeliveries.length}</span>
            </div>
            <Separator className="my-3" />
            <div className="space-y-3">
              {driver.recentDeliveries.length > 0 ? (
                driver.recentDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-foreground">#{delivery.orderId.slice(-8).toUpperCase()}</p>
                      <p className="truncate text-muted-foreground">{delivery.customerName}</p>
                      <p className="text-xs text-muted-foreground">{delivery.storeName} - {delivery.createdAtLabel}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{delivery.status}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{formatPrice(delivery.orderTotal)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-sm text-muted-foreground">Todavia no tiene pedidos asignados.</p>
              )}
            </div>
          </div>

          <p className="font-mono text-xs text-muted-foreground">#{driver.id}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
