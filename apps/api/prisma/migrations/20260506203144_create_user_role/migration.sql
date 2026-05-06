-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SCHOOL', 'CUSTOMER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'SCHOOL';
