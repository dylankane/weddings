-- DeliveryZone: replace geographic fields with distance tier fields
ALTER TABLE "rental"."delivery_zones" ADD COLUMN "min_km" DECIMAL(65,30);
ALTER TABLE "rental"."delivery_zones" ADD COLUMN "max_km" DECIMAL(65,30);
ALTER TABLE "rental"."delivery_zones" DROP COLUMN "zone_type";
ALTER TABLE "rental"."delivery_zones" DROP COLUMN "is_enquire_only";
ALTER TABLE "rental"."delivery_zones" DROP COLUMN "center_lat";
ALTER TABLE "rental"."delivery_zones" DROP COLUMN "center_lng";
ALTER TABLE "rental"."delivery_zones" DROP COLUMN "radius_km";

-- Drop ZoneType enum
DROP TYPE "rental"."ZoneType";

-- Delivery: store Distance Matrix API results
ALTER TABLE "rental"."deliveries" ADD COLUMN "distance_km" DECIMAL(65,30);
ALTER TABLE "rental"."deliveries" ADD COLUMN "duration_mins" INTEGER;

-- CompanySettings: public free zone label
ALTER TABLE "rental"."company_settings" ADD COLUMN "delivery_free_zone_label" TEXT;
