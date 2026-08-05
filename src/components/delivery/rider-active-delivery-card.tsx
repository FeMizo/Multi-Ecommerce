"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, MapPinned, Navigation, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { DELIVERY_STATUS_LABELS, type DeliveryStatusValue } from "@/lib/delivery"

type Props = {
  storeSlug: string
  delivery: {
    id: string
    status: DeliveryStatusValue
    formattedAddress: string | null
    lat: number | null
    lng: number | null
    notes: string | null
    order: {
      id: string
      total: number
      customerEmail: string | null
      customer: { name: string | null; phone: string | null } | null
      items: Array<{ id: string; quantity: number; unitPrice: number; productSnapshot: unknown }>
    }
  }
}

export function RiderActiveDeliveryCard({ storeSlug, delivery }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<DeliveryStatusValue | "CANCELLED" | null>(null)

  async function updateStatus(status: DeliveryStatusValue) {
    setLoading(status)
    const res = await fetch(`/api/rider/${storeSlug}/deliveries/${delivery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setLoading(null)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo actualizar la entrega")
      return
    }
    toast.success("Estado actualizado")
    router.refresh()
  }

  const mapsUrl = delivery.lat !== null && delivery.lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${delivery.lat},${delivery.lng}`
    : delivery.formattedAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.formattedAddress)}`
      : null

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Pedido activo</CardTitle>
          <Badge variant="outline">{DELIVERY_STATUS_LABELS[delivery.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="font-mono text-sm">#{delivery.order.id.slice(-8).toUpperCase()}</p>
          <p className="text-sm text-muted-foreground">
            {delivery.order.customer?.name ?? delivery.order.customerEmail ?? "Cliente sin nombre"}
          </p>
          <p className="text-lg font-semibold">{formatPrice(delivery.order.total)}</p>
        </div>

        <div className="space-y-2 rounded-2xl border bg-muted/20 p-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPinned className="mt-0.5 h-4 w-4 text-primary" />
            <p>{delivery.formattedAddress ?? "Sin dirección guardada"}</p>
          </div>
          {delivery.notes && <p className="text-muted-foreground">{delivery.notes}</p>}
        </div>

        <div className="space-y-3">
          {mapsUrl && (
            <Button asChild className="w-full" variant="outline">
              <Link href={mapsUrl} target="_blank" rel="noreferrer">
                <Navigation className="mr-2 h-4 w-4" />
                Abrir en Google Maps
              </Link>
            </Button>
          )}

          {delivery.status === "ASSIGNED" && (
            <Button className="w-full" onClick={() => updateStatus("IN_TRANSIT")} disabled={loading !== null}>
              {loading === "IN_TRANSIT" ? "Actualizando..." : "Marcar en camino"}
            </Button>
          )}
          {delivery.status === "IN_TRANSIT" && (
            <Button className="w-full" onClick={() => updateStatus("DELIVERED")} disabled={loading !== null}>
              {loading === "DELIVERED" ? "Actualizando..." : "Marcar entregado"}
            </Button>
          )}
          {(delivery.status === "ASSIGNED" || delivery.status === "IN_TRANSIT") && (
            <Button variant="outline" className="w-full" onClick={() => updateStatus("CANCELLED")} disabled={loading !== null}>
              {loading === "CANCELLED" ? "Actualizando..." : "Cancelar entrega"}
            </Button>
          )}
        </div>

        <div className="rounded-2xl border bg-muted/20 p-3 text-xs text-muted-foreground">
          {delivery.order.customer?.phone ? (
            <p>Teléfono: {delivery.order.customer.phone}</p>
          ) : (
            <p>Sin teléfono de cliente disponible</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
