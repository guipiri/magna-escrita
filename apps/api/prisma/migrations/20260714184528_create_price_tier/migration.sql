/*
  Warnings:

  - You are about to drop the column `priceId` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Price` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_priceId_fkey";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "priceId";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "priceId" TEXT;

-- AlterTable
ALTER TABLE "Price" DROP COLUMN "amount",
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceTier_priceId_minQuantity_key" ON "PriceTier"("priceId", "minQuantity");

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Price"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Price"("id") ON DELETE SET NULL ON UPDATE CASCADE;
