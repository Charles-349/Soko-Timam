ALTER TABLE "categories" DROP CONSTRAINT "categories_shop_id_shops_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "shop_id";