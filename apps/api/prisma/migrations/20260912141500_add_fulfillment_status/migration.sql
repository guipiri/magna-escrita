-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('WAITING_PRINT', 'PRINTED', 'DELIVERED_TO_SCHOOL', 'DELIVERED_TO_FAMILY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'WAITING_PRINT',
ADD COLUMN "deliveredToFamilyAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'WAITING_PRINT',
ADD COLUMN "printedAt" TIMESTAMP(3),
ADD COLUMN "deliveredToSchoolAt" TIMESTAMP(3),
ADD COLUMN "deliveredToFamilyAt" TIMESTAMP(3);
