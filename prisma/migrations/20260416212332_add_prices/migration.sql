/*
  Warnings:

  - You are about to drop the column `discount` on the `MarketplacePrice` table. All the data in the column will be lost.
  - You are about to drop the column `originalPrice` on the `MarketplacePrice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MarketplacePrice" DROP CONSTRAINT "MarketplacePrice_productId_fkey";

-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_productId_fkey";

-- AlterTable
ALTER TABLE "MarketplacePrice" DROP COLUMN "discount",
DROP COLUMN "originalPrice",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "MarketplacePrice_productId_idx" ON "MarketplacePrice"("productId");

-- CreateIndex
CREATE INDEX "PriceHistory_productId_idx" ON "PriceHistory"("productId");

-- AddForeignKey
ALTER TABLE "MarketplacePrice" ADD CONSTRAINT "MarketplacePrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
