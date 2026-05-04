/*
  Warnings:

  - A unique constraint covering the columns `[magnificCode]` on the table `Book` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `magnificCode` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "magnificCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Book_magnificCode_key" ON "Book"("magnificCode");
