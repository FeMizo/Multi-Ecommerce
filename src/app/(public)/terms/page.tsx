import { InfoPage } from "@/components/public/info-page"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Términos y condiciones", description: "Condiciones generales para comprar y vender en AionSite Shop.", alternates: { canonical: "/terms" } }
export default function LegalPage() {
  return <InfoPage title="Términos y condiciones" description="Condiciones generales para comprar y vender en AionSite Shop." sections={[
  {
    "title": "Marketplace y vendedores",
    "body": "AionSite Shop facilita el encuentro entre compradores y comercios independientes. La tienda identificada en cada producto realiza la venta y responde por su oferta. La plataforma administra el servicio y atiende incidencias de su funcionamiento."
  },
  {
    "title": "Información y cuentas",
    "body": "Proporciona datos de contacto correctos. Puedes comprar como invitado; crear una cuenta permite consultar tu actividad. Protege tus credenciales y comunica cualquier acceso no reconocido a ayuda@aionsite.com.mx."
  },
  {
    "title": "Productos, precios y pedidos",
    "body": "Revisa descripción, variante, cantidad, disponibilidad e importe en MXN antes de confirmar. Los datos del catálogo pertenecen al vendedor. Una confirmación identifica el pedido; no equivale a la entrega ni a acreditar un pago pendiente."
  },
  {
    "title": "Pagos",
    "body": "Cada tienda habilita sus métodos de pago. En transferencia, sigue las instrucciones y conserva tu comprobante. En pago contra entrega, el cobro se realiza al recibir. No compartas contraseñas ni códigos bancarios con vendedores o soporte."
  },
  {
    "title": "Recogida y entrega",
    "body": "Consulta dirección, horario, zona y costo publicados por la tienda. El envío local requiere una ubicación válida. Si faltan datos, solicita aclaración antes de confirmar. Los plazos concretos se acuerdan con el vendedor."
  },
  {
    "title": "Cancelaciones, cambios y devoluciones",
    "body": "Contacta a la tienda con el número de pedido, motivo y evidencia pertinente para solicitar cancelación, cambio o devolución. La solución dependerá del estado del pedido, del producto y de los derechos aplicables. Las políticas del vendedor no pueden reducir derechos del consumidor; no se establece una renuncia general a reembolsos."
  },
  {
    "title": "Incidencias y derechos",
    "body": "Si no obtienes respuesta del vendedor, escribe a ayuda@aionsite.com.mx para solicitar asistencia e identificar la operación. Conserva confirmación, comprobantes y comunicaciones. Puedes acudir a las autoridades competentes, incluida PROFECO, conforme a la legislación mexicana."
  },
  {
    "title": "Uso permitido y actualizaciones",
    "body": "No publiques contenido ilícito, ofertas engañosas ni datos ajenos sin autorización. Podemos restringir usos abusivos y actualizar estas condiciones. Los cambios se publican aquí; consulta también Privacidad y Cookies."
  }
]} />
}
