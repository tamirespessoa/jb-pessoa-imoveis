CREATE TABLE "property_clients" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_clients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "property_clients_clientId_propertyId_key" ON "property_clients"("clientId", "propertyId");
CREATE INDEX "property_clients_propertyId_idx" ON "property_clients"("propertyId");
ALTER TABLE "property_clients" ADD CONSTRAINT "property_clients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_clients" ADD CONSTRAINT "property_clients_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
