ALTER TYPE "public"."order_status" ADD VALUE 'processing' BEFORE 'shipped';--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_origin_station_id_stations_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "origin_station_id" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_origin_station_id_stations_id_fk" FOREIGN KEY ("origin_station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "origin_station_id";