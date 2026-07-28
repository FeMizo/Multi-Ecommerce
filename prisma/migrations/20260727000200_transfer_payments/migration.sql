ALTER TYPE "public"."PaymentMethod" ADD VALUE IF NOT EXISTS 'TRANSFER';

ALTER TABLE "public"."stores"
ADD COLUMN IF NOT EXISTS "transferEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "transferInstructions" TEXT;

ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "transferCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_transferCode_key" ON "public"."orders"("transferCode");
