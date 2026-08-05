-- CreateEnum
CREATE TYPE "public"."DriverStatus" AS ENUM ('AVAILABLE', 'OFFLINE');

-- AddColumn
ALTER TABLE "public"."drivers" ADD COLUMN "email" TEXT;

-- Backfill
UPDATE "public"."drivers"
SET "email" = LOWER(CONCAT('driver-', SUBSTRING("id" FROM 1 FOR 8), '@local.test'))
WHERE "email" IS NULL OR "email" = '';

-- Make required
ALTER TABLE "public"."drivers" ALTER COLUMN "email" SET NOT NULL;

-- AddColumn
ALTER TABLE "public"."drivers" ADD COLUMN "status" "public"."DriverStatus" NOT NULL DEFAULT 'AVAILABLE';

-- Remove legacy index
DROP INDEX IF EXISTS "drivers_storeId_isActive_idx";

-- CreateIndex
CREATE UNIQUE INDEX "drivers_storeId_email_key" ON "public"."drivers"("storeId", "email");

-- CreateIndex
CREATE INDEX "drivers_storeId_status_idx" ON "public"."drivers"("storeId", "status");

-- DropColumn
ALTER TABLE "public"."drivers" DROP COLUMN "isActive";
