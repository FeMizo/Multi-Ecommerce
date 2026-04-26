import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success"

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <ClearCartOnSuccess />
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-2">¡Pedido confirmado!</h1>
      <p className="text-muted-foreground mb-8">
        Tu pago fue procesado con éxito. Recibirás una confirmación por correo electrónico pronto.
      </p>
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
