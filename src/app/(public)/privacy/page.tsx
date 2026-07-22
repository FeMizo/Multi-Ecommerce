import { InfoPage } from "@/components/public/info-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Como usamos informacion necesaria para operar cuentas, tiendas, pedidos y soporte.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacidad"
      description="Como usamos informacion necesaria para operar cuentas, tiendas, pedidos y soporte."
      sections={[
        { title: "Datos que usamos", body: "Podemos procesar nombre, correo, telefono, direccion de envio, datos de tienda y datos de pedidos para operar el marketplace." },
        { title: "Finalidad", body: "Usamos la informacion para autenticar usuarios, gestionar pedidos, contactar compradores o vendedores, prevenir abuso y dar soporte." },
        { title: "Terceros", body: "Algunas funciones pueden depender de proveedores de pago, correo, almacenamiento o analitica. Solo compartimos la informacion necesaria para prestar el servicio." },
      ]}
    />
  )
}
