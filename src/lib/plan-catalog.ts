export type PlanCatalogEntry = {
  name: string
  slug: string
  priceMonthly: number
  priceYearly: number
  maxProducts: number | null
  maxOrdersMonth: number | null
  commissionRate: number
  stripePriceId: string | null
  features: Record<string, boolean>
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    name: "Starter",
    slug: "starter",
    priceMonthly: 50,
    priceYearly: 500,
    maxProducts: 20,
    maxOrdersMonth: 100,
    commissionRate: 0.03,
    stripePriceId: "price_1Tsr4UIecXF2Xs1S0YmYEALi",
    features: { analytics: true, customDomain: false, staffInvites: false, prioritySupport: false },
  },
  {
    name: "Pro",
    slug: "pro",
    priceMonthly: 100,
    priceYearly: 1000,
    maxProducts: 80,
    maxOrdersMonth: 150,
    commissionRate: 0.02,
    stripePriceId: "price_1Tsr4VIecXF2Xs1SDwRMFQIt",
    features: { analytics: true, customDomain: true, staffInvites: true, prioritySupport: false },
  },
  {
    name: "Business",
    slug: "business",
    priceMonthly: 400,
    priceYearly: 4000,
    maxProducts: 150,
    maxOrdersMonth: 250,
    commissionRate: 0,
    stripePriceId: "price_1Tsr4WIecXF2Xs1S67pkNhdz",
    features: { analytics: true, customDomain: true, staffInvites: true, prioritySupport: true },
  },
  {
    name: "Agency",
    slug: "agency",
    priceMonthly: 1000,
    priceYearly: 10000,
    maxProducts: null,
    maxOrdersMonth: null,
    commissionRate: 0,
    stripePriceId: "price_1TyIqFIecXF2Xs1Sddv1gK6g",
    features: { analytics: true, customDomain: true, staffInvites: true, prioritySupport: true },
  },
]
