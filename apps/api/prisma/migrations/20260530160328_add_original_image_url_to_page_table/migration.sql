/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentId,authographsEventId]` on the table `Book` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "originalImageUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Book_enrollmentId_authographsEventId_key" ON "Book"("enrollmentId", "authographsEventId");
