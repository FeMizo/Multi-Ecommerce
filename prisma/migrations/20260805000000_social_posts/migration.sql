DO $$
BEGIN
  CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "social_posts" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "channels" TEXT[] NOT NULL,
  "caption" TEXT NOT NULL,
  "imageUrl" TEXT,
  "destinationUrl" TEXT NOT NULL DEFAULT 'https://shop.aionsite.com.mx',
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "SocialPostStatus" NOT NULL DEFAULT 'SCHEDULED',
  "publishedAt" TIMESTAMP(3),
  "facebookPostId" TEXT,
  "instagramMediaId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "social_posts_status_scheduledAt_idx" ON "social_posts"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "social_posts_publishedAt_idx" ON "social_posts"("publishedAt");
