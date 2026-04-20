/*
  Warnings:

  - Made the column `marketplace` on table `PriceHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PriceHistory" ALTER COLUMN "marketplace" SET NOT NULL;
