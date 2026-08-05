ALTER TABLE "public"."stores" ADD COLUMN "riderInviteCode" TEXT;

UPDATE "public"."stores"
SET "riderInviteCode" = substr(md5(random()::text || clock_timestamp()::text), 1, 24)
WHERE "riderInviteCode" IS NULL;

ALTER TABLE "public"."stores" ALTER COLUMN "riderInviteCode" SET NOT NULL;

CREATE UNIQUE INDEX "stores_riderInviteCode_key" ON "public"."stores"("riderInviteCode");
