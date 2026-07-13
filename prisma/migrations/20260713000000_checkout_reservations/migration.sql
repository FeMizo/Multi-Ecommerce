-- Stable checkout idempotency key used to reserve stock before redirecting to Stripe.
ALTER TABLE "orders" ADD COLUMN "checkoutToken" TEXT;

CREATE UNIQUE INDEX "orders_checkoutToken_key" ON "orders"("checkoutToken");
