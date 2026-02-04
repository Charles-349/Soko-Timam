import { and, eq, gte, inArray, lte, or } from "drizzle-orm";
import db from "../Drizzle/db";
import { stations, agents, shipping, TSShipping, TIShipping, TIStation, TIAgent } from "../Drizzle/schema";
import { sql } from "drizzle-orm";

// STATIONS

export const createStationService = async (station: TIStation) => {
  await db.insert(stations).values(station);
  return "Station created successfully";
};

export const getStationsService = async () => {
  return await db.query.stations.findMany({
    with: {
      manager: true,
    },
  });
};


export const getStationByIdService = async (id: number) => {
  return await db.query.stations.findFirst({
    where: eq(stations.id, id),
    with: {
      manager: true,
    },
  });
};


export const updateStationService = async (id: number, station: Partial<TIStation>) => {
  const updated = await db.update(stations).set(station).where(eq(stations.id, id)).returning();
  if (!updated.length) return null;
  return "Station updated successfully";
};

export const deleteStationService = async (id: number) => {
  const deleted = await db.delete(stations).where(eq(stations.id, id)).returning();
  if (!deleted.length) return null;
  return "Station deleted successfully";
};

// AGENTS

export const createAgentService = async (agent: TIAgent) => {
  await db.insert(agents).values(agent);
  return "Agent created successfully";
};

export const getAgentsService = async () => {
  return await db.query.agents.findMany({
    with: {
      user: true,
    },
  });
};

export const getAgentByIdService = async (id: number) => {
  return await db.query.agents.findFirst({
    where: eq(agents.id, id),
    with: {
      user: true,
    },
  });
};

export const updateAgentService = async (id: number, agent: Partial<TIAgent>) => {
  const updated = await db.update(agents).set(agent).where(eq(agents.id, id)).returning();
  if (!updated.length) return null;
  return "Agent updated successfully";
};

export const deleteAgentService = async (id: number) => {
  const deleted = await db.delete(agents).where(eq(agents.id, id)).returning();
  if (!deleted.length) return null;
  return "Agent deleted successfully";
};

// SHIPPING
export const createShippingService = async (ship: TIShipping) => {
  await db.insert(shipping).values(ship);
  return "Shipping record created successfully";
};
export const getShippingService = async () => {
  const shippingRecords = await db.query.shipping.findMany({
    with: {
      originStation: true,
      pickupStation: true,
      pickupAgent: true,
      order: true, // join orders table
    },
  });

  return shippingRecords.map((ship) => ({
    ...ship,
    estimatedDelivery: ship.estimatedDelivery ?? null, 
    recipientName: ship.recipientName ?? null,
    recipientPhone: ship.recipientPhone ?? null,
    originStation: ship.originStation ?? null,
    pickupStation: ship.pickupStation ?? null,
    pickupAgent: ship.pickupAgent ?? null,
    order: ship.order ?? null, 
  }));
};


export const getShippingByIdService = async (id: number) => {
  return await db.query.shipping.findFirst({
    where: eq(shipping.id, id),
     with: {
      originStation: true,
      pickupStation: true,
      pickupAgent: true,
      order: true,
    },
  });
};

export const updateShippingService = async (id: number, ship: Partial<TIShipping>) => {
  const updated = await db.update(shipping).set(ship).where(eq(shipping.id, id)).returning();
  if (!updated.length) return null;
  return "Shipping record updated successfully";
};

export const deleteShippingService = async (id: number) => {
  const deleted = await db.delete(shipping).where(eq(shipping.id, id)).returning();
  if (!deleted.length) return null;
  return "Shipping record deleted successfully";
};

// Get shipping by Order ID
export const getShippingByOrderIdService = async (orderId: number) => {
  return await db.query.shipping.findFirst({
    where: eq(shipping.orderId, orderId),
  });
};

// Get shippings by Status
export const getShippingsByStatusService = async (status: string) => {
  return await db.query.shipping.findMany({
    where: sql`${shipping.status} = ${status}`,
  });
};

// Get completed shippings (delivered)
export const getCompletedShippingsService = async () => {
  return await db.query.shipping.findMany({
    where: eq(shipping.status, "delivered"),
  });
};

// Get shippings by Date Range (e.g., reports for a period)
export const getShippingsByDateRangeService = async (
  startDate: Date,
  endDate: Date
) => {
  return await db.query.shipping.findMany({
    where: and(
      gte(shipping.createdAt, startDate),
      lte(shipping.createdAt, endDate)
    ),
  });
};

// Shipping with related Order 
export const getShippingWithOrderService = async (id: number) => {
  return await db.query.shipping.findFirst({
    where: eq(shipping.id, id),
    with: {
      order: {
        with: {
          items: true,
          payments: true,
          user: true,
        },
      },
    },
  });
};


//get shippings with related order by agent id
export const getShippingsByAgentIdService = async (agentId: number) => {
  return await db.query.shipping.findMany({
    where: eq(shipping.pickupAgentId, agentId),
    with: {
      order: {
        with: {
          items: true,
          payments: true,
          user: true,
        },
      },
    },
  });
};


//Get shippings with related order by station id
export const getShippingsByStationIdService = async (stationId: number) => {
  return await db.query.shipping.findMany({
    where: or(
      eq(shipping.originStationId, stationId),
      eq(shipping.pickupStationId, stationId)
    ),
    with: {
      order: {
        with: {
          items: true,
          payments: true,
          user: true,
        },
      },
    },
  });
};