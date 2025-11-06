ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DEFAULT 'preparing'::text;--> statement-breakpoint
DROP TYPE "public"."shipping_status";--> statement-breakpoint
CREATE TYPE "public"."shipping_status" AS ENUM('preparing', 'dispatched', 'delivered');--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DEFAULT 'preparing'::"public"."shipping_status";--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DATA TYPE "public"."shipping_status" USING "shipping_status"::"public"."shipping_status";