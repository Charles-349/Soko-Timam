ALTER TABLE "coupons" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "discount_type" varchar(20) DEFAULT 'percent' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;