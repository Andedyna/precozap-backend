/*
  Warnings:

  - You are about to drop the column `inStock` on the `MarketplacePrice` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `MarketplacePrice` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MarketplacePrice" DROP COLUMN "inStock",
DROP COLUMN "url";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "brand",
DROP COLUMN "tags",
ADD COLUMN     "reviews" INTEGER NOT NULL DEFAULT 0;
