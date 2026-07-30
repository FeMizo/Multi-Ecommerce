CREATE TYPE "public"."SocialPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED');

CREATE TABLE "public"."social_posts" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "channels" TEXT[] NOT NULL,
  "caption" TEXT NOT NULL,
  "imageUrl" TEXT,
  "destinationUrl" TEXT NOT NULL DEFAULT 'https://shop.aionsite.com.mx',
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "public"."SocialPostStatus" NOT NULL DEFAULT 'SCHEDULED',
  "publishedAt" TIMESTAMP(3),
  "facebookPostId" TEXT,
  "instagramMediaId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_posts_status_scheduledAt_idx" ON "public"."social_posts"("status", "scheduledAt");
CREATE INDEX "social_posts_publishedAt_idx" ON "public"."social_posts"("publishedAt");
