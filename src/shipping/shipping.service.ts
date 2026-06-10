import { eq, and, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import {
  shipping_settings,
  shipping_distances,
  shipping_weights,
  stations,
  orders,
  products,
  shops,
  agents,
} from "../Drizzle/schema";

// ADMIN SHIPPING SETTINGS

//Get the current shipping settings 
export const getShippingSettingsService = async () => {
  const settings = await db.query.shipping_settings.findFirst();
  if (!settings) throw new Error("Shipping settings not configured");
  return settings;
};

//Create initial shipping settings
export const createShippingSettingsService = async (data: {
  price_per_km: string;
  price_per_kg: string;
  shipping_percentage: number;
  vat_percentage?: number;
}) => {
  const [created] = await db
    .insert(shipping_settings)
    .values({
      price_per_km: data.price_per_km,
      price_per_kg: data.price_per_kg,
      shipping_percentage: data.shipping_percentage,
      vat_percentage: data.vat_percentage ?? 16,
    })
    .returning();
  return created;
};

//Update existing shipping settings and recalculate all distance/weight costs
export const updateShippingSettingsService = async (
  id: number,
  data: Partial<{
    price_per_km: string;
    price_per_kg: string;
    shipping_percentage: number;
    vat_percentage: number;
  }>
) => {
  const [updated] = await db
    .update(shipping_settings)
    .set({ ...data, updated_at: new Date() })
    .where(eq(shipping_settings.id, id))
    .returning();

  if (!updated) return null;

  // Recalculate all distance costs if price_per_km changed
  if (data.price_per_km !== undefined) {
    const pricePerKm = Number(data.price_per_km);
    const allDistances = await db.select().from(shipping_distances);
    for (const dist of allDistances) {
      const newCost = (Number(dist.kilometers) * pricePerKm).toFixed(2);
      await db
        .update(shipping_distances)
        .set({ cost: newCost, updated_at: new Date() })
        .where(eq(shipping_distances.id, dist.id));
    }
  }

  // Recalculate all weight costs if price_per_kg changed
  if (data.price_per_kg !== undefined) {
    const pricePerKg = Number(data.price_per_kg);
    const allWeights = await db.select().from(shipping_weights);
    for (const w of allWeights) {
      const newCost = (Number(w.weight_kg) * pricePerKg).toFixed(2);
      await db
        .update(shipping_weights)
        .set({ cost: newCost, updated_at: new Date() })
        .where(eq(shipping_weights.id, w.id));
    }
  }

  return "Shipping settings updated successfully";
};

//SHIPPING DISTANCES (admin manages station-to-station costs)

export const getShippingDistancesService = async () => {
  return await db.query.shipping_distances.findMany();
};

export const getShippingDistanceByIdService = async (id: number) => {
  return await db.query.shipping_distances.findFirst({
    where: eq(shipping_distances.id, id),
  });
};

export const createShippingDistanceService = async (data: {
  from_station_id: number;
  to_station_id?: number;
  to_agent_id?: number;
  kilometers: string;
}) => {
  const settings = await db.query.shipping_settings.findFirst();
  const pricePerKm = Number(settings?.price_per_km ?? 0);
  const cost = (Number(data.kilometers) * pricePerKm).toFixed(2);

  const [created] = await db
    .insert(shipping_distances)
    .values({
      from_station_id: data.from_station_id,
      to_station_id: data.to_station_id ?? null,
      to_agent_id: data.to_agent_id ?? null,
      kilometers: data.kilometers,
      cost,
    })
    .returning();

  return created;
};

export const updateShippingDistanceService = async (
  id: number,
  data: Partial<{
    from_station_id: number;
    to_station_id: number | null;
    to_agent_id: number | null;
    kilometers: string;
  }>
) => {
  const existing = await db.query.shipping_distances.findFirst({
    where: eq(shipping_distances.id, id),
  });

  if (!existing) return null;

  let cost = existing.cost;

  if (data.kilometers !== undefined) {
    const settings = await db.query.shipping_settings.findFirst();
    const pricePerKm = Number(settings?.price_per_km ?? 0);
    cost = (Number(data.kilometers) * pricePerKm).toFixed(2);
  }

  const [updated] = await db
    .update(shipping_distances)
    .set({
      ...data,
      cost,
      updated_at: new Date(),
    })
    .where(eq(shipping_distances.id, id))
    .returning();

  return updated ? "Distance updated successfully" : null;
};

export const deleteShippingDistanceService = async (id: number) => {
  const deleted = await db
    .delete(shipping_distances)
    .where(eq(shipping_distances.id, id))
    .returning();
  return deleted.length > 0 ? "Distance deleted successfully" : null;
};

// NEAREST STATION LOOKUP
export const findNearestStationToShop = async (shopId: number) => {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, shopId),
  });

  if (!shop) throw new Error(`Shop ${shopId} not found`);

  // All active stations
  const allStations = await db.query.stations.findMany({
    where: eq(stations.isActive, true),
  });

  if (!allStations.length) throw new Error("No stations defined in the system");

  const shopCity = (shop.city ?? "").toLowerCase().trim();
  const shopAddress = (shop.address ?? "").toLowerCase().trim();

  // station in same city
  if (shopCity) {
    const cityMatch = allStations.find(
      (s) =>
        s.county.toLowerCase().trim() === shopCity ||
        s.area.toLowerCase().trim() === shopCity
    );
    if (cityMatch) return cityMatch;
  }

  //station whose county/area appears in the shop address
  if (shopAddress) {
    const addressMatch = allStations.find(
      (s) =>
        shopAddress.includes(s.county.toLowerCase().trim()) ||
        shopAddress.includes(s.area.toLowerCase().trim())
    );
    if (addressMatch) return addressMatch;
  }

  //first active station
  const activeStation = allStations.find((s) => s.isActive) ?? allStations[0];
  return activeStation;
};

// MAIN SHIPPING CALCULATION
export const calculateOrderShipping = async (orderId: number) => {
  // Fetch admin shipping settings
  const settings = await db.query.shipping_settings.findFirst();
  if (!settings) throw new Error("Shipping settings not configured");

  const vatPercentage = Number(settings.vat_percentage ?? 16);
  const shippingDiscountPercentage = Number(settings.shipping_percentage ?? 0);
  const pricePerKm = Number(settings.price_per_km ?? 0);
  const pricePerKg = Number(settings.price_per_kg ?? 0);

  // Fetch order with items - product - shop
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: { with: { product: true, shop: true } } },
  });
  if (!order) throw new Error("Order not found");

  // Group items by seller (shop.sellerId)
  const itemsBySeller: Record<string, typeof order.items> = {};
  for (const item of order.items) {
    const sellerId = item.shop?.sellerId;
    if (sellerId == null) continue;
    const key = String(sellerId);
    if (!itemsBySeller[key]) itemsBySeller[key] = [];
    itemsBySeller[key].push(item);
  }

  let totalDistanceCost = 0;
  let totalWeightCost = 0;

  // For each seller, compute distance + weight costs
  for (const sellerIdStr of Object.keys(itemsBySeller)) {
    const sellerItems = itemsBySeller[sellerIdStr];

    // Get the shop for this seller (all items in a group share the same shop)
    const shopId = sellerItems[0]?.shop?.id;

    // Find nearest origin station for this seller's shop
    let originStationId: number | null = null;
    if (shopId) {
      try {
        const nearestStation = await findNearestStationToShop(shopId);
        originStationId = nearestStation.id;
      } catch {
        // No station available — skip distance cost for this seller
      }
    }

    // Distance cost: origin station → customer pickup station/agent
    let distanceCost = 0;
    const pickupStationId = order.pickupStationId;
    const pickupAgentId = order.pickupAgentId;

    if (originStationId) {
      const pickupStationId = order.pickupStationId;
      const pickupAgentId = order.pickupAgentId;

      let distanceRecord:
        | Awaited<ReturnType<typeof db.query.shipping_distances.findFirst>>
        | undefined;

      // Customer selected station
      if (pickupStationId) {
        distanceRecord = await db.query.shipping_distances.findFirst({
          where: and(
            eq(shipping_distances.from_station_id, originStationId),
            eq(shipping_distances.to_station_id, pickupStationId)
          ),
        });

        if (!distanceRecord) {
          distanceRecord = await db.query.shipping_distances.findFirst({
            where: and(
              eq(shipping_distances.from_station_id, pickupStationId),
              eq(shipping_distances.to_station_id, originStationId)
            ),
          });
        }
      }

      // Customer selected agent
      if (!distanceRecord && pickupAgentId) {
        distanceRecord = await db.query.shipping_distances.findFirst({
          where: and(
            eq(shipping_distances.from_station_id, originStationId),
            eq(shipping_distances.to_agent_id, pickupAgentId)
          ),
        });
      }

      if (distanceRecord) {
        distanceCost = Number(distanceRecord.cost);
      } else if (pricePerKm > 0) {
        // No distance record found — default to 0 km cost
        distanceCost = 0;
      }
    }

    // Weight cost: sum of (weight_kg × price_per_kg × quantity) for each item
    const weightCost = sellerItems.reduce((sum, item) => {
      const weightKg = Number((item as any).product?.weight_kg ?? 0);
      return sum + weightKg * pricePerKg * Number(item.quantity);
    }, 0);

    totalDistanceCost += distanceCost;
    totalWeightCost += weightCost;
  }

  // Apply discount and VAT
  const baseShippingCost = totalDistanceCost + totalWeightCost;
  const discountAmount = (baseShippingCost * shippingDiscountPercentage) / 100;
  const shippingBeforeVat = baseShippingCost - discountAmount;
  const vatAmount = (shippingBeforeVat * vatPercentage) / 100;
  const finalShippingCost = shippingBeforeVat + vatAmount;

  return {
    distance_cost: Number(totalDistanceCost.toFixed(2)),
    weight_cost: Number(totalWeightCost.toFixed(2)),
    base_shipping_cost: Number(baseShippingCost.toFixed(2)),
    shipping_discount_percentage: shippingDiscountPercentage,
    discount_amount: Number(discountAmount.toFixed(2)),
    shipping_before_vat: Number(shippingBeforeVat.toFixed(2)),
    vat_percentage: vatPercentage,
    vat_amount: Number(vatAmount.toFixed(2)),
    final_shipping_cost: Number(finalShippingCost.toFixed(2)),
  };
};
