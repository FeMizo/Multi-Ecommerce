CREATE TABLE "test_checkout_drafts" (
    "id" TEXT NOT NULL,
    "checkoutToken" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "stripeSessionId" TEXT,
    "orderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_checkout_drafts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "test_checkout_drafts_checkoutToken_key" ON "test_checkout_drafts"("checkoutToken");
CREATE UNIQUE INDEX "test_checkout_drafts_stripeSessionId_key" ON "test_checkout_drafts"("stripeSessionId");
