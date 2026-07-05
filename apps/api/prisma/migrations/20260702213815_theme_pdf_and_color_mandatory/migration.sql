/*
  Warnings:

  - Made the column `coverThemePdfUrl` on table `BookTemplateTheme` required. This step will fail if there are existing NULL values in that column.
  - Made the column `colorTheme` on table `BookTemplateTheme` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BookTemplateTheme" ALTER COLUMN "coverThemePdfUrl" SET NOT NULL,
ALTER COLUMN "colorTheme" SET NOT NULL;
