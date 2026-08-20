import { redirect } from "next/navigation"
import { normalizePublicOrderRef } from "@/lib/public-orders"

type Params = { orderRef: string }

export default async function PublicOrderRefPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { orderRef } = await params
  const lookupId = normalizePublicOrderRef(orderRef)
  redirect(lookupId ? `/orders?id=${lookupId}` : "/orders")
}
