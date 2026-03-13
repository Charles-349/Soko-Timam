CREATE TYPE "public"."return_resolution_type" AS ENUM('refund', 'exchange');--> statement-breakpoint
CREATE TYPE "public"."shipping_type" AS ENUM('standard', 'replacement');--> statement-breakpoint
ALTER TABLE "returns" ALTER COLUMN "resolution_type" SET DATA TYPE "public"."return_resolution_type" USING "resolution_type"::"public"."return_resolution_type";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "replacement_for_return_id" integer;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN "replacement_shipment_id" integer;--> statement-breakpoint
ALTER TABLE "shipping" ADD COLUMN "shipping_type" "shipping_type" DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_replacement_for_return_id_returns_id_fk" FOREIGN KEY ("replacement_for_return_id") REFERENCES "public"."returns"("id") ON DELETE no action ON UPDATE no action;