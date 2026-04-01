/*
  Warnings:

  - The `whatsapp` column on the `persons` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "persons" DROP COLUMN "whatsapp",
ADD COLUMN     "whatsapp" BOOLEAN NOT NULL DEFAULT false;
