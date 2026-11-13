import CheckoutForm from "@/components/checkout/checkout-form"
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ storeId?: string }> }) {
  const { storeId } = await searchParams
  return <CheckoutForm key={storeId ?? "single-store"} storeId={storeId ?? null} />
}
