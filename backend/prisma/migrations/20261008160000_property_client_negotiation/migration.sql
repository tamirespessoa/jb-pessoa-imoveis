ALTER TABLE "property_clients" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "property_clients" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'INTERESSADO';
ALTER TABLE "property_clients" ADD COLUMN "notes" TEXT;
CREATE TABLE "property_client_history" (
  "id" TEXT NOT NULL,
  "linkId" TEXT NOT NULL,
  "previousStatus" TEXT,
  "newStatus" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_client_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "property_client_history_linkId_createdAt_idx" ON "property_client_history"("linkId", "createdAt");
ALTER TABLE "property_client_history" ADD CONSTRAINT "property_client_history_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "property_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
