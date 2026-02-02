ALTER TYPE "public"."order_status" ADD VALUE 'at_station' BEFORE 'shipped';--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DEFAULT 'preparing'::text;--> statement-breakpoint
DROP TYPE "public"."shipping_status";--> statement-breakpoint
CREATE TYPE "public"."shipping_status" AS ENUM('preparing', 'in_transit', 'ready_for_pickup', 'picked_up', 'delivered');--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DEFAULT 'preparing'::"public"."shipping_status";--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DATA TYPE "public"."shipping_status" USING "shipping_status"::"public"."shipping_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "origin_station_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "origin_station_id" DROP NOT NULL;