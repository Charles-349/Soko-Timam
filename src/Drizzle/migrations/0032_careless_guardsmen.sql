ALTER TYPE "public"."return_resolution_type" ADD VALUE 'store_credit';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "replacement_of_order_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_replacement" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_replacement_of_order_id_orders_id_fk" FOREIGN KEY ("replacement_of_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;