CREATE TABLE "platform_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"shop_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"commission" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "seller_wallet_transactions" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "platform_commissions" ADD CONSTRAINT "platform_commissions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_commissions" ADD CONSTRAINT "platform_commissions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_commissions" ADD CONSTRAINT "platform_commissions_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;