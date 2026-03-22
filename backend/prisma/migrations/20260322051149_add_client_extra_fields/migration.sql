-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "commercialPhone" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "residentialPhone" TEXT,
ADD COLUMN     "whatsapp" BOOLEAN NOT NULL DEFAULT false;
