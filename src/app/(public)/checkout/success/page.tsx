import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success"
import { db } from "@/lib/db"
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods"
import { buildTransferReference } from "@/lib/transfer-details"

type SearchParams = {
  payment_method?: string
  order_id?: string
  session_id?: string
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { payment_method: paymentMethod, order_id: orderId, session_id: sessionId } = await searchParams
  const order = orderId
    ? await db.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          storeId: true,
          paymentMethod: true,
          transferCode: true,
          store: {
            select: {
              transferAccountName: true,
              transferAccountNumber: true,
              transferBank: true,
              transferReferencePrefix: true,
              transferReferenceExtra: true,
            },
          },
        },
      })
    : sessionId
      ? await db.order.findFirst({
          where: { stripeSessionId: sessionId },
          select: {
            id: true,
            storeId: true,
            paymentMethod: true,
            transferCode: true,
            store: {
              select: {
                transferAccountName: true,
                transferAccountNumber: true,
                transferBank: true,
                transferReferencePrefix: true,
                transferReferenceExtra: true,
              },
            },
          },
        })
    : null

  const effectiveMethod = order?.paymentMethod ?? paymentMethod?.toUpperCase()
  const isCashOnDelivery = effectiveMethod === "CASH_ON_DELIVERY"
  const isTransfer = effectiveMethod === "TRANSFER"

  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <ClearCartOnSuccess storeId={order?.storeId ?? null} />
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-2">
        {isCashOnDelivery || isTransfer ? "Pedido confirmado" : "Pedido confirmado"}
      </h1>
      <p className="text-muted-foreground mb-3">
        {isCashOnDelivery && "Tu pedido quedó registrado con pago contra entrega. Te enviamos un correo con el resumen."}
        {isTransfer && "Tu pedido quedó registrado con pago por transferencia. Te enviamos un correo con el código y las instrucciones."}
        {!isCashOnDelivery && !isTransfer && "Tu pago fue procesado con éxito. Recibirás una confirmación por correo electrónico pronto."}
      </p>

      {isTransfer && (
        <Card className="mb-6 text-left">
          <CardContent className="pt-6 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Código de transferencia</p>
              <p className="font-mono text-xl font-semibold">{order?.transferCode ?? "Pendiente"}</p>
            </div>
            {(order?.store.transferAccountName || order?.store.transferAccountNumber || order?.store.transferBank || buildTransferReference(order?.store.transferReferencePrefix, order?.store.transferReferenceExtra)) && (
              <div className="space-y-1 text-sm text-muted-foreground">
                {order?.store.transferAccountName && <p><span className="text-foreground">Titular:</span> {order.store.transferAccountName}</p>}
                {order?.store.transferBank && <p><span className="text-foreground">Banco:</span> {order.store.transferBank}</p>}
                {order?.store.transferAccountNumber && <p><span className="text-foreground">Cuenta:</span> {order.store.transferAccountNumber}</p>}
                {buildTransferReference(order?.store.transferReferencePrefix, order?.store.transferReferenceExtra) && (
                  <p><span className="text-foreground">Referencia:</span> {buildTransferReference(order?.store.transferReferencePrefix, order?.store.transferReferenceExtra)}</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              El vendedor verá este pago como {PAYMENT_METHOD_LABELS.TRANSFER.toLowerCase()} y lo revisará bajo su propio riesgo.
            </p>
          </CardContent>
        </Card>
      )}

      {orderId && (
        <p className="text-xs text-muted-foreground mb-8 font-mono">
          Pedido #{orderId.slice(-8).toUpperCase()}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/account/orders">Ver mis pedidos</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  )
}


