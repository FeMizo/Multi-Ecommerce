-- CreateEnum
CREATE TYPE "public"."DeliveryMethod" AS ENUM ('PICKUP', 'LOCAL_DELIVERY');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."drivers" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "vehicle" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deliveries" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT,
    "method" "public"."DeliveryMethod" NOT NULL,
    "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "formattedAddress" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drivers_storeId_isActive_idx" ON "public"."drivers"("storeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "public"."deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_storeId_method_idx" ON "public"."deliveries"("storeId", "method");

-- CreateIndex
CREATE INDEX "deliveries_storeId_status_idx" ON "public"."deliveries"("storeId", "status");

-- CreateIndex
CREATE INDEX "deliveries_driverId_idx" ON "public"."deliveries"("driverId");

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deliveries" ADD CONSTRAINT "deliveries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deliveries" ADD CONSTRAINT "deliveries_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
