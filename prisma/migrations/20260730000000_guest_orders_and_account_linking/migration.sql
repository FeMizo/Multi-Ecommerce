ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;

UPDATE "orders" o
SET "customerEmail" = COALESCE(o."customerEmail", o."shippingAddress"->>'email', u.email)
FROM "users" u
WHERE o."customerId" = u.id AND o."customerEmail" IS NULL;

UPDATE "orders"
SET "customerEmail" = COALESCE("customerEmail", "shippingAddress"->>'email')
WHERE "customerEmail" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "customerId" DROP NOT NULL;

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_customerId_fkey";
ALTER TABLE "orders"
ADD CONSTRAINT "orders_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "orders_storeId_customerEmail_idx" ON "orders"("storeId", "customerEmail");
