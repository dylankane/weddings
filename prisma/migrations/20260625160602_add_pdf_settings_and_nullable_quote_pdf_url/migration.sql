-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "bank_details" TEXT,
ADD COLUMN     "payment_instructions" TEXT;

-- AlterTable
ALTER TABLE "quotes" ALTER COLUMN "pdf_url" DROP NOT NULL;
