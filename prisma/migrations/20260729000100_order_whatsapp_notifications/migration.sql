-- Add WhatsApp notification timestamp to orders
ALTER TABLE "orders"
ADD COLUMN "whatsappNotifiedAt" TIMESTAMP(3);
