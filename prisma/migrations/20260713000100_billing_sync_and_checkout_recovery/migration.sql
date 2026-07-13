-- Keep Stripe identifiers one-to-one with local billing records.
CREATE UNIQUE INDEX "plans_stripePriceId_key" ON "plans"("stripePriceId");
CREATE UNIQUE INDEX "store_subscriptions_stripeSubscriptionId_key" ON "store_subscriptions"("stripeSubscriptionId");

-- Track checkout reservations that can be safely reclaimed after Stripe expires.
ALTER TABLE "orders" ADD COLUMN "reservationExpiresAt" TIMESTAMP(3);
UPDATE "orders"
SET "reservationExpiresAt" = "createdAt" + INTERVAL '35 minutes'
WHERE "status" = 'PENDING' AND "reservationExpiresAt" IS NULL;

-- Atomic processing lease prevents concurrent deliveries of one Stripe event.
ALTER TABLE "stripe_webhook_events" ADD COLUMN "processingStartedAt" TIMESTAMP(3);

-- Production MXN plan catalog. Annual display price equals ten monthly payments.
UPDATE "plans"
SET
  "name" = 'Free',
  "priceMonthly" = 0,
  "priceYearly" = 0,
  "maxProducts" = 10,
  "maxOrdersMonth" = 20,
  "commissionRate" = 0.05,
  "features" = '{"analytics":false,"customDomain":false,"staffInvites":false,"prioritySupport":false}'::jsonb,
  "stripePriceId" = NULL,
  "isActive" = true
WHERE "slug" = 'free';

UPDATE "plans"
SET
  "name" = 'Starter',
  "priceMonthly" = 50,
  "priceYearly" = 500,
  "maxProducts" = 50,
  "maxOrdersMonth" = 100,
  "commissionRate" = 0.03,
  "features" = '{"analytics":true,"customDomain":false,"staffInvites":false,"prioritySupport":false}'::jsonb,
  "stripePriceId" = 'price_1Tsr4UIecXF2Xs1S0YmYEALi',
  "isActive" = true
WHERE "slug" = 'starter';

UPDATE "plans"
SET
  "name" = 'Pro',
  "priceMonthly" = 100,
  "priceYearly" = 1000,
  "maxProducts" = 200,
  "maxOrdersMonth" = 500,
  "commissionRate" = 0.02,
  "features" = '{"analytics":true,"customDomain":true,"staffInvites":true,"prioritySupport":false}'::jsonb,
  "stripePriceId" = 'price_1Tsr4VIecXF2Xs1SDwRMFQIt',
  "isActive" = true
WHERE "slug" = 'pro';

INSERT INTO "plans" (
  "id", "name", "slug", "priceMonthly", "priceYearly", "maxProducts",
  "maxOrdersMonth", "commissionRate", "features", "stripePriceId", "isActive", "createdAt"
)
VALUES (
  'plan_business_20260713', 'Business', 'business', 400, 4000, NULL,
  NULL, 0, '{"analytics":true,"customDomain":true,"staffInvites":true,"prioritySupport":true}'::jsonb,
  'price_1Tsr4WIecXF2Xs1S67pkNhdz', true, CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "priceYearly" = EXCLUDED."priceYearly",
  "maxProducts" = EXCLUDED."maxProducts",
  "maxOrdersMonth" = EXCLUDED."maxOrdersMonth",
  "commissionRate" = EXCLUDED."commissionRate",
  "features" = EXCLUDED."features",
  "stripePriceId" = EXCLUDED."stripePriceId",
  "isActive" = EXCLUDED."isActive";
