ALTER TABLE "shops" RENAME COLUMN "owner_id" TO "seller_id";--> statement-breakpoint
ALTER TABLE "shops" RENAME COLUMN "location" TO "address";--> statement-breakpoint
ALTER TABLE "shops" DROP CONSTRAINT "shops_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "primary_category" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "business_type" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "product_categories" text[];--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "business_registration_number" varchar(100);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "kra_pin" varchar(50);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "tax_id" varchar(50);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "expected_monthly_orders" integer;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "cover_url";