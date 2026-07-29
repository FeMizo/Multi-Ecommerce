-- Add product variant options
ALTER TABLE "products"
ADD COLUMN "variantOptions" JSONB;
