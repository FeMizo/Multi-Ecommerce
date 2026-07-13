export type CheckoutSessionStatus = "open" | "complete" | "expired" | null

export function checkoutRecoveryAction(status: CheckoutSessionStatus) {
  if (status === "complete" || status === null) return "preserve" as const
  if (status === "open") return "expire_then_release" as const
  return "release" as const
}
