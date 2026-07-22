import { InfoPage } from "@/components/public/info-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terminos y condiciones",
  description: "Reglas generales para usar AionSite Shop como comprador o vendedor.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <InfoPage
      title="Terminos y condiciones"
      description="Reglas generales para usar AionSite Shop como comprador o vendedor."
      sections={[
        { title: "Uso de la plataforma", body: "AionSite Shop conecta compradores con vendedores independientes. Cada usuario debe usar la plataforma con informacion veraz y respetar las operaciones realizadas dentro del sitio." },
        { title: "Compras y ventas", body: "Los vendedores son responsables de sus productos, inventario, precios, entregas y atencion al cliente. Las compras directas en la pagina pueden procesarse mediante proveedores de pago habilitados." },
        { title: "Cambios", body: "Podemos actualizar estos terminos para reflejar cambios legales, operativos o de producto. La version vigente sera la publicada en esta pagina." },
      ]}
    />
  )
}
