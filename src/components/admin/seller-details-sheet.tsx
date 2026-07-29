"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { PanelRightOpen } from "lucide-react"
import { buildTransferReference } from "@/lib/transfer-details"

type Member = {
  id: string
  role: string
  name: string | null
  email: string
  phone: string | null
}

type SellerDetailsSheetProps = {
  storeName: string
  slug: string
  description: string | null
  cityName: string | null
  isActive: boolean
  isVerified: boolean
  stripeOnboarded: boolean
  stripeAccountId: string | null
  cashOnDeliveryEnabled: boolean
  transferEnabled: boolean
  transferAccountName: string | null
  transferAccountNumber: string | null
  transferBank: string | null
  transferReferencePrefix: string | null
  transferReferenceExtra: string | null
  planName: string | null
  commissionRate: number | null
  productsCount: number
  ordersCount: number
  revenueLabel: string
  createdAtLabel: string
  ownerName: string | null
  ownerEmail: string | null
  ownerPhone: string | null
  members: Member[]
}

function buildWhatsAppLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

export function SellerDetailsSheet({
  storeName,
  slug,
  description,
  cityName,
  isActive,
  isVerified,
  stripeOnboarded,
  stripeAccountId,
  cashOnDeliveryEnabled,
  transferEnabled,
  transferAccountName,
  transferAccountNumber,
  transferBank,
  transferReferencePrefix,
  transferReferenceExtra,
  planName,
  commissionRate,
  productsCount,
  ordersCount,
  revenueLabel,
  createdAtLabel,
  ownerName,
  ownerEmail,
  ownerPhone,
  members,
}: SellerDetailsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <PanelRightOpen className="h-4 w-4" />
          <span className="sr-only">Abrir detalle</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92vw] overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="mb-6 pr-8 text-left">
          <SheetTitle>{storeName}</SheetTitle>
          <SheetDescription>/{slug}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Activa" : "Oculta"}</Badge>
            <Badge variant={isVerified ? "default" : "outline"}>{isVerified ? "Verificada" : "Sin verificar"}</Badge>
            <Badge variant={stripeOnboarded ? "default" : "outline"}>{stripeOnboarded ? "Stripe listo" : "Stripe pendiente"}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ciudad</p>
              <p className="font-medium">{cityName ?? "Sin ciudad"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
              <p className="font-medium">{planName ?? "Sin plan"}</p>
              {commissionRate !== null && (
                <p className="text-xs text-muted-foreground">Comisión: {Math.round(commissionRate * 100)}%</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Productos</p>
              <p className="font-medium">{productsCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedidos</p>
              <p className="font-medium">{ordersCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</p>
              <p className="font-medium">{revenueLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Creada</p>
              <p className="font-medium">{createdAtLabel}</p>
            </div>
          </div>

          {description && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Descripción</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{description}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Contacto principal</p>
                <p className="text-sm text-muted-foreground">Pedidos por WhatsApp requieren número registrado.</p>
              </div>
              {ownerPhone ? (
                <Button asChild variant="outline">
                  <a href={buildWhatsAppLink(ownerPhone)} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  WhatsApp no disponible
                </Button>
              )}
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="font-medium">{ownerName ?? "Sin dueño"}</p>
              <p className="text-sm text-muted-foreground">{ownerEmail ?? "Sin email"}</p>
              <p className="text-sm text-muted-foreground">{ownerPhone ?? "Sin teléfono"}</p>
              {!ownerPhone && (
                <p className="text-xs text-muted-foreground">Agrega un número para habilitar pedidos por WhatsApp.</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Contra entrega:</span> {cashOnDeliveryEnabled ? "Sí" : "No"}</p>
            <p><span className="text-muted-foreground">Transferencia:</span> {transferEnabled ? "Sí" : "No"}</p>
            <p><span className="text-muted-foreground">Stripe:</span> {stripeAccountId ? "Conectado" : "No conectado"}</p>
          </div>

          {(transferAccountName || transferAccountNumber || transferBank || buildTransferReference(transferReferencePrefix, transferReferenceExtra)) && (
            <>
              <Separator />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Datos de transferencia</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {transferAccountName && <p><span className="text-foreground">Titular:</span> {transferAccountName}</p>}
                  {transferBank && <p><span className="text-foreground">Banco:</span> {transferBank}</p>}
                  {transferAccountNumber && <p><span className="text-foreground">Cuenta:</span> {transferAccountNumber}</p>}
                  {buildTransferReference(transferReferencePrefix, transferReferenceExtra) && (
                    <p><span className="text-foreground">Referencia:</span> {buildTransferReference(transferReferencePrefix, transferReferenceExtra)}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <div>
              <p className="font-semibold">Miembros</p>
              <p className="text-sm text-muted-foreground">Detalles completos del vendedor y su equipo.</p>
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{member.name ?? member.email}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-sm text-muted-foreground">{member.phone ?? "Sin teléfono"}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
