"use client"
import { useEffect, useState } from "react"
import { StoreFulfillmentInfo, type StoreFulfillment } from "./store-fulfillment"
export function CartDeliveryInfo({ storeId }: { storeId: string }) {
  const [store, setStore] = useState<StoreFulfillment | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/stores?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<StoreFulfillment> })
      .then((store) => { if (!controller.signal.aborted) setStore(store) })
      .catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [storeId])
  if (failed) return <p role="status" className="text-sm">No pudimos consultar la entrega. Revísala al continuar con esta tienda.</p>
  if (!store) return <p role="status" className="text-sm">Consultando entrega…</p>
  return <StoreFulfillmentInfo store={store} plain />
}
