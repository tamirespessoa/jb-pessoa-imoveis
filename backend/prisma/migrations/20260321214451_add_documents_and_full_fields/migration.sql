/*
  Warnings:

  - Added the required column `fileName` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressDistrict" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "addressState" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "addressZipCode" TEXT,
ADD COLUMN     "dependentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fgtsBalance" DOUBLE PRECISION,
ADD COLUMN     "hasDependents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "monthlyIncome" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "profession" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "builtArea" DOUBLE PRECISION,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "condominiumFee" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "iptuValue" DOUBLE PRECISION,
ADD COLUMN     "landArea" DOUBLE PRECISION,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "ownerId" INTEGER,
ADD COLUMN     "parkingSpaces" INTEGER,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "suites" INTEGER,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
