import { InfoPage } from "@/components/public/info-page"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Cookies y almacenamiento local", description: "Cómo se utiliza el almacenamiento del navegador en AionSite Shop.", alternates: { canonical: "/cookies" } }
export default function LegalPage() {
  return <InfoPage title="Cookies y almacenamiento local" description="Cómo se utiliza el almacenamiento del navegador en AionSite Shop." sections={[
  {
    "title": "Qué son",
    "body": "Las cookies son pequeños datos enviados al navegador. El almacenamiento local guarda información en el dispositivo y no se envía automáticamente como una cookie. Ambos permiten conservar información entre visitas."
  },
  {
    "title": "Sesión y seguridad",
    "body": "Las cookies de autenticación permiten mantener la sesión y proteger operaciones de cuenta. Son necesarias para funciones que requieren identificar al usuario; comprar como invitado continúa disponible."
  },
  {
    "title": "Carrito y preferencias",
    "body": "El carrito se conserva mediante almacenamiento local del navegador. Puede incluir productos, variantes, imágenes, cantidades e identificadores de tienda. Borrar estos datos elimina el carrito de ese navegador. Las preferencias de interfaz también pueden persistir en el dispositivo."
  },
  {
    "title": "Servicios externos",
    "body": "Al usar mapas o pagos se solicitan recursos de proveedores externos, que pueden utilizar sus propias tecnologías de almacenamiento según sus políticas y configuración. La carga de un mapa permite buscar y seleccionar la dirección; no convierte automáticamente el centro del mapa en una dirección de entrega confirmada."
  },
  {
    "title": "Duración y dispositivos",
    "body": "Los datos de sesión y los persistentes tienen duraciones distintas. El almacenamiento local puede permanecer hasta que lo borres. El carrito guardado en un navegador no implica sincronización automática con otros dispositivos."
  },
  {
    "title": "Control desde el navegador",
    "body": "Puedes consultar, bloquear y borrar cookies y datos del sitio en la configuración de privacidad de tu navegador. Bloquear lo necesario puede cerrar tu sesión o impedir conservar el carrito. Para dudas escribe a ayuda@aionsite.com.mx y consulta la página de Privacidad."
  }
]} />
}
