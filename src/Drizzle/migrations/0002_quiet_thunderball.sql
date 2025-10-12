ALTER TABLE "shipping" ADD COLUMN "recipient_name" varchar(255);--> statement-breakpoint
ALTER TABLE "shipping" ADD COLUMN "recipient_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "shipping" ADD COLUMN "address" text NOT NULL;