CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"county" varchar(100) NOT NULL,
	"area" varchar(150) NOT NULL,
	"address" varchar,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"manager_id" integer NOT NULL,
	"county" varchar(100) NOT NULL,
	"area" varchar(150) NOT NULL,
	"address" varchar,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DEFAULT 'preparing'::text;--> statement-breakpoint
DROP TYPE "public"."shipping_status";--> statement-breakpoint
CREATE TYPE "public"."shipping_status" AS ENUM('preparing', 'at_station', 'in_transit', 'ready_for_pickup', 'picked_up', 'delivered');--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DEFAULT 'preparing'::"public"."shipping_status";--> statement-breakpoint
ALTER TABLE "shipping" ALTER COLUMN "shipping_status" SET DATA TYPE "public"."shipping_status" USING "shipping_status"::"public"."shipping_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "origin_station_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pickup_station_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pickup_agent_id" integer;--> statement-breakpoint
ALTER TABLE "shipping" ADD COLUMN "origin_station_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping" ADD COLUMN "pickup_station_id" integer;--> statement-breakpoint
ALTER TABLE "shipping" ADD COLUMN "pickup_agent_id" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_origin_station_id_stations_id_fk" FOREIGN KEY ("origin_station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_station_id_stations_id_fk" FOREIGN KEY ("pickup_station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_agent_id_agents_id_fk" FOREIGN KEY ("pickup_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping" ADD CONSTRAINT "shipping_origin_station_id_stations_id_fk" FOREIGN KEY ("origin_station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping" ADD CONSTRAINT "shipping_pickup_station_id_stations_id_fk" FOREIGN KEY ("pickup_station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping" ADD CONSTRAINT "shipping_pickup_agent_id_agents_id_fk" FOREIGN KEY ("pickup_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping" DROP COLUMN "courier";--> statement-breakpoint
ALTER TABLE "shipping" DROP COLUMN "tracking_number";