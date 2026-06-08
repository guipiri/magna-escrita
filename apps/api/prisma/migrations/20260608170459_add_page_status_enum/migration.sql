/*
  Warnings:

  - The values [FOR_REVIEW] on the enum `BookStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'REVISED_BY_SCHOOL');

-- AlterEnum
BEGIN;
CREATE TYPE "BookStatus_new" AS ENUM ('DRAFT', 'REVISED_BY_SCHOOL', 'READY', 'ARCHIVED');
ALTER TABLE "public"."Book" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Book" ALTER COLUMN "status" TYPE "BookStatus_new" USING ("status"::text::"BookStatus_new");
ALTER TYPE "BookStatus" RENAME TO "BookStatus_old";
ALTER TYPE "BookStatus_new" RENAME TO "BookStatus";
DROP TYPE "public"."BookStatus_old";
ALTER TABLE "Book" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "status" "PageStatus" NOT NULL DEFAULT 'NOT_STARTED';
