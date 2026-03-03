CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TABLE "ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer,
	"type" varchar(20) NOT NULL,
	"source" varchar(50) NOT NULL,
	"reference_id" integer,
	"amount" numeric(14, 2) NOT NULL,
	"balance_after" numeric(14, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"status" "settlement_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "seller_wallets" RENAME COLUMN "pending_withdrawal" TO "pending_balance";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "platform_commission" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "seller_earning" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "return_window_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "escrow_release_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_escrow_released" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_escrow_locked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "escrow_locked_amount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "escrow_released_amount" numeric(15, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN "refund_responsibility" varchar(30);--> statement-breakpoint
ALTER TABLE "seller_wallets" ADD COLUMN "available_balance" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_wallets" ADD COLUMN "total_withdrawn" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_wallets" ADD CONSTRAINT "seller_wallets_seller_id_unique" UNIQUE("seller_id");