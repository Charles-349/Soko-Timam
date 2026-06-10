-- Migration to create shipping related tables
-- Shipping Settings
CREATE TABLE "shipping_settings" (
  "id" serial PRIMARY KEY,
  "price_per_km" decimal(10, 2) NOT NULL DEFAULT '0',
  "price_per_kg" decimal(10, 2) NOT NULL DEFAULT '0',
  "shipping_percentage" integer NOT NULL DEFAULT 0,
  "vat_percentage" integer NOT NULL DEFAULT 16,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
-- Shipping Distances
CREATE TABLE "shipping_distances" (
  "id" serial PRIMARY KEY,
  "from_station_id" integer NOT NULL REFERENCES "stations"("id"),
  "to_station_id" integer NOT NULL REFERENCES "stations"("id"),
  "kilometers" decimal(10, 2) NOT NULL,
  "cost" decimal(10, 2) NOT NULL DEFAULT '0',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
-- Shipping Weights (product weight cost)
CREATE TABLE "shipping_weights" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id"),
  "weight_kg" decimal(10, 3) NOT NULL,
  "cost" decimal(10, 2) NOT NULL DEFAULT '0',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
-- Trigger to update shipping_distances.cost based on admin price_per_km
CREATE OR REPLACE FUNCTION update_distance_cost() RETURNS trigger AS $$
DECLARE
    price_per_km decimal(10,2);
BEGIN
    SELECT "price_per_km" INTO price_per_km FROM "shipping_settings" LIMIT 1;
    IF price_per_km IS NULL THEN
        price_per_km := 0;
    END IF;
    NEW."cost" := NEW."kilometers" * price_per_km;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_update_distance_cost
BEFORE INSERT OR UPDATE ON "shipping_distances"
FOR EACH ROW EXECUTE FUNCTION update_distance_cost();
-- Trigger to update shipping_weights.cost based on admin price_per_kg
CREATE OR REPLACE FUNCTION update_weight_cost() RETURNS trigger AS $$
DECLARE
    price_per_kg decimal(10,2);
BEGIN
    SELECT "price_per_kg" INTO price_per_kg FROM "shipping_settings" LIMIT 1;
    IF price_per_kg IS NULL THEN
        price_per_kg := 0;
    END IF;
    NEW."cost" := NEW."weight_kg" * price_per_kg;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_update_weight_cost
BEFORE INSERT OR UPDATE ON "shipping_weights"
FOR EACH ROW EXECUTE FUNCTION update_weight_cost();
