/*
  Warnings:

  - A unique constraint covering the columns `[enquiry_id]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "enquiry_id" INTEGER;

-- CreateTable
CREATE TABLE "enquiries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "wedding_date" DATE NOT NULL,
    "venue_name" TEXT NOT NULL,
    "venue_county" TEXT NOT NULL,
    "venue_address" TEXT,
    "product_slugs" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_enquiry_id_key" ON "jobs"("enquiry_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
