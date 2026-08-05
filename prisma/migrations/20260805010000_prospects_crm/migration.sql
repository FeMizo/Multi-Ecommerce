DO $$
BEGIN
  CREATE TYPE "ProspectSource" AS ENUM ('MANUAL', 'GOOGLE_MAPS', 'FACEBOOK', 'INSTAGRAM', 'REFERRAL', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ProspectContactChannel" AS ENUM ('IN_PERSON', 'EMAIL', 'PHONE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ProspectStatus" AS ENUM (
    'NEW',
    'PENDING_CONTACT',
    'CONTACTED',
    'REPLIED',
    'FOLLOW_UP',
    'SECOND_MESSAGE',
    'MEETING_SCHEDULED',
    'PROPOSAL_SENT',
    'NEGOTIATION',
    'WON',
    'NO_RESPONSE',
    'DISCARDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ProspectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ProspectActivityType" AS ENUM (
    'CREATED',
    'CONTACT_ATTEMPT',
    'MESSAGE_SENT',
    'EMAIL_SENT',
    'IN_PERSON_VISIT',
    'PHONE_CALL',
    'RESPONSE_RECEIVED',
    'FOLLOW_UP',
    'MEETING',
    'PROPOSAL_SENT',
    'STATUS_CHANGED',
    'NOTE_ADDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "prospects" (
  "id" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "businessNameNormalized" TEXT NOT NULL,
  "slug" TEXT,
  "contactName" TEXT,
  "phone" TEXT,
  "phoneNormalized" TEXT,
  "email" TEXT,
  "emailNormalized" TEXT,
  "website" TEXT,
  "websiteNormalized" TEXT,
  "facebookUrl" TEXT,
  "facebookUrlNormalized" TEXT,
  "instagramUrl" TEXT,
  "instagramUrlNormalized" TEXT,
  "googleMapsUrl" TEXT,
  "googleMapsUrlNormalized" TEXT,
  "address" TEXT,
  "city" TEXT NOT NULL,
  "category" TEXT,
  "notes" TEXT,
  "source" "ProspectSource" NOT NULL DEFAULT 'MANUAL',
  "status" "ProspectStatus" NOT NULL DEFAULT 'NEW',
  "priority" "ProspectPriority" NOT NULL DEFAULT 'MEDIUM',
  "assignedToId" TEXT,
  "lastContactAt" TIMESTAMP(3),
  "nextFollowUpAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "prospects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prospects_slug_key" UNIQUE ("slug")
);

CREATE TABLE IF NOT EXISTS "prospect_activities" (
  "id" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "channel" "ProspectContactChannel" NOT NULL DEFAULT 'OTHER',
  "activityType" "ProspectActivityType" NOT NULL,
  "comment" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "performedById" TEXT NOT NULL,
  "result" TEXT,
  "nextFollowUpAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "prospect_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prospects_businessNameNormalized_idx" ON "prospects"("businessNameNormalized");
CREATE INDEX IF NOT EXISTS "prospects_phoneNormalized_idx" ON "prospects"("phoneNormalized");
CREATE INDEX IF NOT EXISTS "prospects_emailNormalized_idx" ON "prospects"("emailNormalized");
CREATE INDEX IF NOT EXISTS "prospects_websiteNormalized_idx" ON "prospects"("websiteNormalized");
CREATE INDEX IF NOT EXISTS "prospects_googleMapsUrlNormalized_idx" ON "prospects"("googleMapsUrlNormalized");
CREATE INDEX IF NOT EXISTS "prospects_facebookUrlNormalized_idx" ON "prospects"("facebookUrlNormalized");
CREATE INDEX IF NOT EXISTS "prospects_instagramUrlNormalized_idx" ON "prospects"("instagramUrlNormalized");
CREATE INDEX IF NOT EXISTS "prospects_city_idx" ON "prospects"("city");
CREATE INDEX IF NOT EXISTS "prospects_status_idx" ON "prospects"("status");
CREATE INDEX IF NOT EXISTS "prospects_priority_idx" ON "prospects"("priority");
CREATE INDEX IF NOT EXISTS "prospects_assignedToId_idx" ON "prospects"("assignedToId");
CREATE INDEX IF NOT EXISTS "prospects_nextFollowUpAt_idx" ON "prospects"("nextFollowUpAt");

CREATE INDEX IF NOT EXISTS "prospect_activities_prospectId_occurredAt_idx" ON "prospect_activities"("prospectId", "occurredAt");
CREATE INDEX IF NOT EXISTS "prospect_activities_performedById_idx" ON "prospect_activities"("performedById");
CREATE INDEX IF NOT EXISTS "prospect_activities_activityType_idx" ON "prospect_activities"("activityType");
CREATE INDEX IF NOT EXISTS "prospect_activities_channel_idx" ON "prospect_activities"("channel");

ALTER TABLE "prospects"
  ADD CONSTRAINT "prospects_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prospect_activities"
  ADD CONSTRAINT "prospect_activities_prospectId_fkey"
  FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prospect_activities"
  ADD CONSTRAINT "prospect_activities_performedById_fkey"
  FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
