import { InfoPage } from "@/components/public/info-page"
import { buildKeywords } from "@/lib/seo"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookies",
  description: "Informacion sobre cookies y almacenamiento local usados por AionSite Shop.",
  keywords: buildKeywords("Cookies", ["politica de cookies", "almacenamiento local", "preferencias del sitio"]),
  alternates: { canonical: "/cookies" },
}

export default function CookiesPage() {
  return (
    <InfoPage
      title="Cookies"
      description="Informacion sobre cookies y almacenamiento local usados por AionSite Shop."
      sections={[
        { title: "Cookies esenciales", body: "Usamos cookies o almacenamiento local necesarios para iniciar sesion, mantener el carrito, recordar preferencias y proteger la cuenta." },
        { title: "Medicion", body: "Podemos usar herramientas de medicion para entender errores, rendimiento y uso general del sitio." },
        { title: "Control", body: "Puedes borrar cookies desde tu navegador. Algunas funciones, como sesion o carrito, pueden dejar de funcionar correctamente." },
      ]}
    />
  )
}
