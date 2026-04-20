-- AlterTable
ALTER TABLE "MarketplacePrice" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "MarketplacePrice_productId_marketplace_price_idx" ON "MarketplacePrice"("productId", "marketplace", "price");

-- CreateIndex
CREATE INDEX "PriceHistory_marketplace_idx" ON "PriceHistory"("marketplace");
