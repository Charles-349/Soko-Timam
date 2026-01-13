CREATE TYPE "public"."wallet_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "seller_wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"product_id" integer,
	"amount" numeric(14, 2) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'completed',
	"wallet_status" "wallet_status" DEFAULT 'completed',
	"seller_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seller_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_earned" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pending_withdrawal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "seller_wallet_transactions" ADD CONSTRAINT "seller_wallet_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_wallet_transactions" ADD CONSTRAINT "seller_wallet_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_wallet_transactions" ADD CONSTRAINT "seller_wallet_transactions_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_wallets" ADD CONSTRAINT "seller_wallets_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;