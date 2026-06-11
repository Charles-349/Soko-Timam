ALTER TYPE "public"."return_status" ADD VALUE 'processing' BEFORE 'refunded';--> statement-breakpoint
CREATE TABLE "shipping_distances" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_station_id" integer NOT NULL,
	"to_station_id" integer,
	"to_agent_id" integer,
	"kilometers" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipping_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"price_per_km" numeric(10, 2) DEFAULT '0' NOT NULL,
	"price_per_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
	"shipping_percentage" integer DEFAULT 0 NOT NULL,
	"vat_percentage" integer DEFAULT 16 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipping_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"weight_kg" numeric(10, 3) NOT NULL,
	"cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_kg" numeric(10, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping_distances" ADD CONSTRAINT "shipping_distances_from_station_id_stations_id_fk" FOREIGN KEY ("from_station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_distances" ADD CONSTRAINT "shipping_distances_to_station_id_stations_id_fk" FOREIGN KEY ("to_station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_distances" ADD CONSTRAINT "shipping_distances_to_agent_id_agents_id_fk" FOREIGN KEY ("to_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_weights" ADD CONSTRAINT "shipping_weights_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;