import Link from "next/link"
import { Mail, Phone } from "lucide-react"
import { InfoPage } from "@/components/public/info-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Centro de ayuda",
  description: "Soporte para compradores y vendedores de AionSite Shop.",
  alternates: { canonical: "/help" },
}

export default function HelpPage() {
  return (
    <div>
      <InfoPage
        title="Centro de ayuda"
        description="Soporte para compradores y vendedores de AionSite Shop."
        sections={[
          { title: "Compradores", body: "Revisa tus pedidos desde tu cuenta. Si necesitas ayuda con una compra, ten a la mano el numero de pedido y la tienda donde compraste." },
          { title: "Vendedores", body: "Desde tu panel puedes administrar productos, pedidos, datos de tienda, facturacion y conexion de pagos." },
          { title: "Pagos", body: "Las ventas directas en la pagina se procesan con el proveedor de pago configurado. Las comisiones aplican solo a esas ventas directas." },
        ]}
      />
      <div className="container mx-auto px-4 pb-12">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Contacto</h2>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <Link href="mailto:ayuda@aionsite.com.mx" className="flex items-center gap-2 hover:text-foreground">
              <Mail className="h-4 w-4" />
              ayuda@aionsite.com.mx
            </Link>
            <Link href="tel:+529381573988" className="flex items-center gap-2 hover:text-foreground">
              <Phone className="h-4 w-4" />
              +52 938 157 3988
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
