"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserRoundPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DELIVERY_STATUS_LABELS,
  DRIVER_STATUS_LABELS,
  buildDeliveryAssignmentMessage,
  buildWhatsAppLink,
  type DriverStatusValue,
} from "@/lib/delivery"
import { formatPrice } from "@/lib/utils"

type DriverOption = {
  id: string
  name: string
  phone: string
  plate: string
  licenseNumber: string
  status: DriverStatusValue
}

type DeliveryItem = {
  id: string
  status: string
  formattedAddress: string | null
  lat: number | null
  lng: number | null
  notes: string | null
  driverId: string | null
  driver: {
    id: string
    name: string
    phone: string
    plate: string
    licenseNumber: string
    status: DriverStatusValue
  } | null
  order: {
    id: string
    total: number
    customerEmail: string | null
    customer: { name: string | null; phone: string | null } | null
  }
}

type Props = {
  storeSlug: string
  delivery: DeliveryItem
  drivers: DriverOption[]
}

export function DeliveryAssignmentPanel({ storeSlug, delivery, drivers }: Props) {
  const router = useRouter()
  const [selectedDriverId, setSelectedDriverId] = useState(delivery.driverId ?? "")
  const [loading, setLoading] = useState(false)

  const selectableDrivers = useMemo(() => {
    return drivers.filter((driver) => driver.status === "AVAILABLE" || driver.id === delivery.driverId)
  }, [delivery.driverId, drivers])

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === (selectedDriverId === "none" ? "" : selectedDriverId)) ?? null,
    [drivers, selectedDriverId]
  )

  function buildWhatsAppMessage() {
    const riderUrl = `${window.location.origin}/rider/${storeSlug}`
    const mapUrl =
      delivery.lat !== null && delivery.lng !== null
        ? `https://www.google.com/maps/search/?api=1&query=${delivery.lat},${delivery.lng}`
        : delivery.formattedAddress
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.formattedAddress)}`
          : null

    return buildDeliveryAssignmentMessage({
      orderId: `#${delivery.order.id.slice(-8).toUpperCase()}`,
      customerName: delivery.order.customer?.name ?? delivery.order.customerEmail ?? "Cliente sin nombre",
      customerPhone: delivery.order.customer?.phone ?? null,
      address: delivery.formattedAddress,
      notes: delivery.notes,
      totalLabel: formatPrice(delivery.order.total),
      riderUrl,
      mapUrl,
    })
  }

  async function assignDriver(nextDriverId: string) {
    setLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/deliveries/${delivery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: nextDriverId || null }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo asignar el repartidor")
      return
    }
    toast.success(nextDriverId ? "Repartidor asignado" : "Entrega desasignada")
    router.refresh()
  }

  async function assignAndOpenWhatsApp() {
    if (!selectedDriver || selectedDriver.status !== "AVAILABLE") {
      toast.error("Selecciona un repartidor disponible")
      return
    }

    const popup = window.open("", "_blank", "noopener,noreferrer")
    setLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/deliveries/${delivery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: selectedDriver.id }),
    })
    setLoading(false)

    if (!res.ok) {
      popup?.close()
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo asignar el repartidor")
      return
    }

    const whatsappUrl = buildWhatsAppLink(selectedDriver.phone, buildWhatsAppMessage())
    if (popup) {
      popup.location.href = whatsappUrl
    } else {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    }
    toast.success("Repartidor asignado. Abriendo WhatsApp...")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRoundPlus className="h-4 w-4" />
          Asignacion manual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{DELIVERY_STATUS_LABELS[delivery.status as keyof typeof DELIVERY_STATUS_LABELS] ?? delivery.status}</Badge>
          <Badge variant="secondary">{formatPrice(delivery.order.total)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {delivery.order.customer?.name ?? delivery.order.customerEmail ?? "Cliente sin nombre"}
        </p>
        <p className="text-sm text-muted-foreground">{delivery.formattedAddress ?? "Sin direccion guardada"}</p>
        <div className="space-y-1">
          <label className="text-sm font-medium">Repartidor disponible</label>
          <Select value={selectedDriverId || "none"} onValueChange={setSelectedDriverId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin asignar</SelectItem>
              {selectableDrivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name} - {driver.phone} - {DRIVER_STATUS_LABELS[driver.status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void assignDriver(selectedDriverId === "none" ? "" : selectedDriverId)}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar asignacion
          </Button>
          <Button
            onClick={() => void assignAndOpenWhatsApp()}
            disabled={loading || !selectedDriver || selectedDriver.status !== "AVAILABLE"}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Asignar y WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => void assignDriver("")}
            disabled={loading || !delivery.driverId}
          >
            Desasignar
          </Button>
        </div>
        {delivery.driver && (
          <p className="text-xs text-muted-foreground">
            Actual: {delivery.driver.name} - {delivery.driver.phone} - {DRIVER_STATUS_LABELS[delivery.driver.status]}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
