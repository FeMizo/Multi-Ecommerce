import { InfoPage } from "@/components/public/info-page"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Privacidad", description: "Tratamiento de datos personales al usar AionSite Shop.", alternates: { canonical: "/privacy" } }
export default function LegalPage() {
  return <InfoPage title="Privacidad" description="Tratamiento de datos personales al usar AionSite Shop." sections={[
  {
    "title": "Alcance y contacto",
    "body": "Este texto describe el tratamiento de datos en el marketplace AionSite Shop. Para consultas y solicitudes de privacidad escribe a ayuda@aionsite.com.mx. Las tiendas independientes también tratan los datos que reciben para atender sus ventas."
  },
  {
    "title": "Datos que proporcionas",
    "body": "Se utilizan nombre, correo, teléfono, datos de cuenta, información de tienda y datos de pedidos. En entrega local se incorpora la dirección y las coordenadas seleccionadas. Evita incluir datos sensibles en notas o mensajes."
  },
  {
    "title": "Finalidades necesarias",
    "body": "Los datos permiten autenticar cuentas, conservar el carrito, gestionar compras y entregas, comunicar estados del pedido, atender soporte y prevenir fraude. Puedes comprar como invitado, aunque se requieren datos de contacto para atender el pedido."
  },
  {
    "title": "Pagos y destinatarios",
    "body": "La tienda recibe los datos necesarios para preparar y atender tu compra; el repartidor recibe los necesarios para entregar. Los proveedores habilitados de pagos, correo y alojamiento procesan información necesaria para prestar sus servicios. Los datos bancarios introducidos en un proveedor de pagos se rigen también por su aviso."
  },
  {
    "title": "Conservación y seguridad",
    "body": "Se aplican medidas de acceso y seguridad para proteger la información. La conservación depende de la operación, obligaciones aplicables e incidencias pendientes. No existe un plazo único para todos los datos ni se garantiza seguridad absoluta."
  },
  {
    "title": "Acceso, rectificación, cancelación y oposición",
    "body": "Puedes solicitar acceso, corrección, cancelación u oposición al tratamiento, así como revocar tu consentimiento cuando proceda, mediante ayuda@aionsite.com.mx. Indica el derecho solicitado, datos a los que se refiere y un medio de respuesta. Se solicitará acreditar identidad por un canal apropiado; no envíes contraseñas ni datos bancarios."
  },
  {
    "title": "Preferencias y cambios",
    "body": "Puedes gestionar almacenamiento desde tu navegador y consultar Cookies para conocer sus efectos. Las finalidades adicionales requieren la información y consentimiento que correspondan. Las actualizaciones a este texto se publican en esta página."
  }
]} />
}
