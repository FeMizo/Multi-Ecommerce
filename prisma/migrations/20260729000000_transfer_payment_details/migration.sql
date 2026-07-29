ALTER TABLE "public"."stores"
ADD COLUMN IF NOT EXISTS "transferAccountName" TEXT,
ADD COLUMN IF NOT EXISTS "transferAccountNumber" TEXT,
ADD COLUMN IF NOT EXISTS "transferBank" TEXT,
ADD COLUMN IF NOT EXISTS "transferReferencePrefix" TEXT,
ADD COLUMN IF NOT EXISTS "transferReferenceExtra" TEXT;
