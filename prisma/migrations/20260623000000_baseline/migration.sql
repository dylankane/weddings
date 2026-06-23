-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "rental";

-- CreateEnum
CREATE TYPE "rental"."ApiName" AS ENUM ('GEOCODING', 'DISTANCE_MATRIX', 'PLACES_TEXT_SEARCH');

-- CreateEnum
CREATE TYPE "rental"."ApiTrigger" AS ENUM ('MANAGER_TOOL', 'PUBLIC_CALCULATOR');

-- CreateEnum
CREATE TYPE "rental"."CustomisationOptionType" AS ENUM ('TEXT', 'SELECT', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "rental"."DeliveryMethod" AS ENUM ('STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "rental"."EmailTriggerEvent" AS ENUM ('ENQUIRY_SUBMITTED_CUSTOMER', 'ENQUIRY_SUBMITTED_MANAGER', 'QUOTE_SENT', 'INVOICE_SENT');

-- CreateEnum
CREATE TYPE "rental"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "rental"."JobSource" AS ENUM ('CUSTOMER_FORM', 'MANAGER_CREATED');

-- CreateEnum
CREATE TYPE "rental"."JobStatus" AS ENUM ('ENQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "rental"."UserRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'CLIENT');

-- CreateEnum
CREATE TYPE "rental"."ZoneType" AS ENUM ('NAMED_REGION', 'RADIUS');

-- CreateTable
CREATE TABLE "rental"."api_usage_logs" (
    "id" SERIAL NOT NULL,
    "api_name" "rental"."ApiName" NOT NULL,
    "triggered_by" "rental"."ApiTrigger" NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."company_settings" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "tagline" TEXT,
    "logo_light_small_url" TEXT,
    "logo_light_large_url" TEXT,
    "logo_dark_small_url" TEXT,
    "logo_dark_large_url" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "contact_address" TEXT NOT NULL,
    "social_links" JSONB,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "delivery_info_text" TEXT,
    "business_lat" DECIMAL(65,30),
    "business_lng" DECIMAL(65,30),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" INTEGER,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."deliveries" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "outbound_method" "rental"."DeliveryMethod" NOT NULL,
    "return_method" "rental"."DeliveryMethod" NOT NULL,
    "venue_name" TEXT,
    "venue_address" TEXT,
    "venue_eircode" TEXT,
    "venue_county" TEXT,
    "lat" DECIMAL(65,30),
    "lng" DECIMAL(65,30),
    "notes" TEXT,
    "outbound_at" TIMESTAMP(3),
    "return_at" TIMESTAMP(3),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."delivery_zones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "zone_type" "rental"."ZoneType" NOT NULL,
    "price" DECIMAL(10,2),
    "is_enquire_only" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "center_lat" DECIMAL(65,30),
    "center_lng" DECIMAL(65,30),
    "radius_km" DECIMAL(65,30),

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."email_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_event" "rental"."EmailTriggerEvent" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."invoices" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "rental"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "due_date" DATE,
    "pdf_url" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."job_item_customisations" (
    "id" SERIAL NOT NULL,
    "job_item_id" INTEGER NOT NULL,
    "customisation_option_id" INTEGER,
    "value" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "job_item_customisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."job_item_dates" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "job_item_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "job_item_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."job_items" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2),
    "notes" TEXT,
    "customisation_check" BOOLEAN,

    CONSTRAINT "job_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."jobs" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "rental"."JobStatus" NOT NULL DEFAULT 'ENQUIRY',
    "source" "rental"."JobSource" NOT NULL,
    "job_start" DATE,
    "job_end" DATE,
    "notes" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."pricing" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "rental_cost" DECIMAL(10,2) NOT NULL,
    "delivery_cost" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "delivery_zone_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."product_customisation_options" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "rental"."CustomisationOptionType",
    "options" JSONB,
    "base_price" DECIMAL(10,2),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_customisation_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."product_images" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stock_quantity" INTEGER NOT NULL,
    "is_customisable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "price_per_event" DECIMAL(10,2),
    "price_per_day" DECIMAL(10,2),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."quotes" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental"."session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "rental"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "rental"."UserRole" NOT NULL DEFAULT 'MANAGER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_job_id_key" ON "rental"."deliveries"("job_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_trigger_event_key" ON "rental"."email_templates"("trigger_event" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_job_id_key" ON "rental"."invoices"("job_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_reference_key" ON "rental"."invoices"("reference" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_job_id_key" ON "rental"."pricing"("job_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "rental"."products"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "quotes_job_id_key" ON "rental"."quotes"("job_id" ASC);

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "rental"."session"("expire" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "rental"."users"("email" ASC);

-- AddForeignKey
ALTER TABLE "rental"."api_usage_logs" ADD CONSTRAINT "api_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "rental"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "rental"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."company_settings" ADD CONSTRAINT "company_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "rental"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."deliveries" ADD CONSTRAINT "deliveries_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "rental"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."invoices" ADD CONSTRAINT "invoices_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "rental"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."job_item_customisations" ADD CONSTRAINT "job_item_customisations_customisation_option_id_fkey" FOREIGN KEY ("customisation_option_id") REFERENCES "rental"."product_customisation_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."job_item_customisations" ADD CONSTRAINT "job_item_customisations_job_item_id_fkey" FOREIGN KEY ("job_item_id") REFERENCES "rental"."job_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."job_item_dates" ADD CONSTRAINT "job_item_dates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "rental"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."job_item_dates" ADD CONSTRAINT "job_item_dates_job_item_id_fkey" FOREIGN KEY ("job_item_id") REFERENCES "rental"."job_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."job_item_dates" ADD CONSTRAINT "job_item_dates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."job_items" ADD CONSTRAINT "job_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "rental"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."job_items" ADD CONSTRAINT "job_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."jobs" ADD CONSTRAINT "jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "rental"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."jobs" ADD CONSTRAINT "jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "rental"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."pricing" ADD CONSTRAINT "pricing_delivery_zone_id_fkey" FOREIGN KEY ("delivery_zone_id") REFERENCES "rental"."delivery_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."pricing" ADD CONSTRAINT "pricing_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "rental"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."product_customisation_options" ADD CONSTRAINT "product_customisation_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "rental"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental"."quotes" ADD CONSTRAINT "quotes_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "rental"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

