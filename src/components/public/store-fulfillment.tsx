import { formatPrice } from "@/lib/utils"
export type StoreFulfillment = {
  address?: string | null; phone?: string | null; openingHours?: string | null
  deliveryFee?: number | null; deliveryZone?: string | null; latitude?: number | null; longitude?: number | null
}
export function StoreFulfillmentInfo({ store, pickup = false, plain = false }: { store: StoreFulfillment; pickup?: boolean; plain?: boolean }) {
  return <div className={plain ? "space-y-1 text-sm break-words" : "space-y-2 rounded-xl border p-4 text-sm break-words"}>
    {pickup ? <><p>Dirección: {store.address || "Pendiente de configurar"}</p><p>Teléfono: {store.phone || "Pendiente de configurar"}</p><p>Horario: {store.openingHours || "Pendiente de configurar"}</p>
    {(!store.address || !store.phone || !store.openingHours) && <p role="status">La tienda aún no publica todos sus datos de recogida. Confirma dirección y horario antes de acudir.</p>}</> : <>
    <p>Envío local: {store.deliveryFee == null ? "Costo pendiente de configurar" : formatPrice(store.deliveryFee)}</p>
    <p>Zona de entrega: {store.deliveryZone || "Pendiente de configurar"}</p>
    </>}
  </div>
}
