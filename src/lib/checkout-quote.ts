import { calculateCouponDiscount } from "./store-coupons"
import { isLocalDeliveryConfigured } from "./delivery"
import { fromMinorUnits, toMinorUnits } from "./money"
import { accumulateVariantQuantities, getVariantQuantityLimit, isValidVariantSelection, normalizeVariantOptions, productVariantIdentity, type ProductVariantSelection } from "./product-variants"
type Coupon = Parameters<typeof calculateCouponDiscount>[0] & { code: string }
type QuoteInput = {
  store: { id: string; deliveryFee: number | null; deliveryZone: string | null; latitude: number | null; longitude: number | null }
  products: { id: string; storeId: string; price: number; manageStock: boolean; stock: number; variantOptions: unknown }[]
  items: { productId: string; quantity: number; variantSelection: ProductVariantSelection[] }[]
  deliveryMethod: "PICKUP" | "LOCAL_DELIVERY"; couponCode?: string; coupon?: Coupon | null
}
export type CheckoutQuote = { subtotal: number; discountAmount: number; shippingFee: number; total: number; couponCode: string | null; unitPrices: Record<string, number> }
export function quoteCheckout({ store, products, items, deliveryMethod, couponCode, coupon }: QuoteInput): CheckoutQuote {
  if (!items.length) throw new Error("Elige productos para continuar")
  const identities = new Set<string>()
  const quantities = new Map<string, number>()
  const productQuantities = new Map<string, number>()
  let subtotalCents = 0
  for (const item of items) {
    const product = products.find((product) => product.id === item.productId && product.storeId === store.id)
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Revisa los productos y cantidades del carrito")
    const options = normalizeVariantOptions(product.variantOptions)
    const identity = productVariantIdentity(product.id, item.variantSelection)
    if (identities.has(identity) || !isValidVariantSelection(options, item.variantSelection)) throw new Error("Revisa las variantes del carrito")
    identities.add(identity)
    const productQuantity = (productQuantities.get(product.id) ?? 0) + item.quantity
    productQuantities.set(product.id, productQuantity)
    if (product.manageStock && (product.stock < productQuantity || (getVariantQuantityLimit(options, item.variantSelection) ?? product.stock) < item.quantity || !accumulateVariantQuantities(product.id, options, item.variantSelection, item.quantity, quantities))) throw new Error("No hay existencias suficientes para esta selección")
    subtotalCents += toMinorUnits(product.price) * item.quantity
  }
  const subtotal = fromMinorUnits(subtotalCents)
  if (couponCode && (!coupon || coupon.code !== couponCode)) throw new Error("El cupón no existe para esta tienda")
  const discountAmount = couponCode && coupon ? calculateCouponDiscount(coupon, subtotal) : 0
  if (discountAmount === null) throw new Error("El cupón no es válido para estos productos o ya no está disponible")
  let shippingFee = 0
  if (deliveryMethod === "LOCAL_DELIVERY") {
    if (!isLocalDeliveryConfigured(store)) throw new Error("La tienda aún no configura su entrega local")
    shippingFee = store.deliveryFee!
  }
  return { unitPrices: Object.fromEntries(products.map((product) => [product.id, product.price])), subtotal, discountAmount, shippingFee, total: fromMinorUnits(subtotalCents - toMinorUnits(discountAmount) + toMinorUnits(shippingFee)), couponCode: couponCode ?? null }
}
