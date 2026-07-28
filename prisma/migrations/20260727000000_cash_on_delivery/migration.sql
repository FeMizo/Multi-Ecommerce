CREATE TYPE "public"."PaymentMethod" AS ENUM ('STRIPE', 'CASH_ON_DELIVERY');

ALTER TABLE "public"."stores"
ADD COLUMN "cashOnDeliveryEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."orders"
ADD COLUMN "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'STRIPE';
