/*
  Warnings:

  - You are about to drop the column `quote_validity_text` on the `company_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "company_settings" DROP COLUMN "quote_validity_text",
ADD COLUMN     "invoice_notes" TEXT,
ADD COLUMN     "quote_notes" TEXT;
