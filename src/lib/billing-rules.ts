export function hasPlanEntitlements(status: string) {
  return status === "ACTIVE" || status === "TRIALING"
}

export function getCurrentPeriodEnd(periodEnds: number[]) {
  return periodEnds.length ? new Date(Math.max(...periodEnds) * 1_000) : null
}

export function isFullRefund(paymentAmount: number, refundAmountCents: number) {
  return Math.round(paymentAmount * 100) === refundAmountCents
}
