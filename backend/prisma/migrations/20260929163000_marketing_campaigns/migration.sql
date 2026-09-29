CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'META_ADS',
  "objective" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
  "budget" DOUBLE PRECISION DEFAULT 0,
  "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "revenueGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commissionGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "notes" TEXT,
  "externalCampaignId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "propertyId" TEXT,
  CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "marketing_campaigns_platform_idx" ON "marketing_campaigns"("platform");
CREATE INDEX IF NOT EXISTS "marketing_campaigns_status_idx" ON "marketing_campaigns"("status");
CREATE INDEX IF NOT EXISTS "marketing_campaigns_propertyId_idx" ON "marketing_campaigns"("propertyId");
CREATE INDEX IF NOT EXISTS "marketing_campaigns_startDate_idx" ON "marketing_campaigns"("startDate");
CREATE INDEX IF NOT EXISTS "marketing_campaigns_createdAt_idx" ON "marketing_campaigns"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketing_campaigns_propertyId_fkey'
  ) THEN
    ALTER TABLE "marketing_campaigns"
      ADD CONSTRAINT "marketing_campaigns_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
