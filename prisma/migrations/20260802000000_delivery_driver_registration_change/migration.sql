-- Remove rider invite code from stores
ALTER TABLE "public"."stores" DROP COLUMN IF EXISTS "riderInviteCode";

-- Normalize drivers for self-registration
ALTER TABLE "public"."drivers" ALTER COLUMN "phone" SET DEFAULT '';
UPDATE "public"."drivers"
SET "phone" = COALESCE("phone", '')
WHERE "phone" IS NULL;
ALTER TABLE "public"."drivers" ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "public"."drivers" ADD COLUMN IF NOT EXISTS "plate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "public"."drivers" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT NOT NULL DEFAULT '';

UPDATE "public"."drivers"
SET "plate" = COALESCE("plate", ''),
    "licenseNumber" = COALESCE("licenseNumber", '')
WHERE "plate" IS NULL OR "licenseNumber" IS NULL;

ALTER TABLE "public"."drivers" DROP CONSTRAINT IF EXISTS "drivers_storeId_fkey";
ALTER TABLE "public"."drivers" ALTER COLUMN "storeId" DROP NOT NULL;
ALTER TABLE "public"."drivers"
  ADD CONSTRAINT "drivers_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "drivers_storeId_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "drivers_email_key" ON "public"."drivers"("email");

ALTER TABLE "public"."drivers" DROP COLUMN IF EXISTS "vehicle";
