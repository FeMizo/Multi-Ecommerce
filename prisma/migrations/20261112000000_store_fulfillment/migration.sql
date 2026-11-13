ALTER TABLE "stores"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "openingHours" TEXT,
  ADD COLUMN "deliveryZone" TEXT,
  ADD COLUMN "deliveryFee" DOUBLE PRECISION,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "stores" ADD CONSTRAINT "stores_deliveryFee_nonnegative" CHECK ("deliveryFee" IS NULL OR "deliveryFee" >= 0);
ALTER TABLE "stores" ADD CONSTRAINT "stores_latitude_range" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90);
ALTER TABLE "stores" ADD CONSTRAINT "stores_longitude_range" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
ALTER TABLE "orders" ADD COLUMN "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
