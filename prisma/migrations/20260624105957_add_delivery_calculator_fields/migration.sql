-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "calculator_result" TEXT,
ADD COLUMN     "maps_url" TEXT,
ADD COLUMN     "suggested_price" DECIMAL(10,2);
