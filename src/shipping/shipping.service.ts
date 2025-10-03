import { eq, sql, and, gte, lte } from "drizzle-orm";
import db from "../Drizzle/db";
import { TIShipping, shipping } from "../Drizzle/schema";

// Create shipping record
export const createShippingService = async (ship: TIShipping) => {
  await db.insert(shipping).values(ship);
  return "Shipping record created successfully";
};

// Get all shipping records
export const getShippingsService = async () => {
  return await db.query.shipping.findMany();
};

// Get shipping by ID
export const getShippingByIdService = async (id: number) => {
  return await db.query.shipping.findFirst({
    where: eq(shipping.id, id),
  });
};

// Update shipping
export const updateShippingService = async (
  id: number,
  data: Partial<TIShipping>
) => {
  const updatedShipping = await db
    .update(shipping)
    .set(data)
    .where(eq(shipping.id, id))
    .returning();

  if (updatedShipping.length === 0) {
    return null;
  }
  return "Shipping updated successfully";
};

// Delete shipping
export const deleteShippingService = async (id: number) => {
  const deletedShipping = await db
    .delete(shipping)
    .where(eq(shipping.id, id))
    .returning();

  if (deletedShipping.length === 0) {
    return null;
  }
  return "Shipping deleted successfully";
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

// Get active shippings (dispatched or in-transit)
export const getActiveShippingsService = async () => {
  return await db.query.shipping.findMany({
    where: sql`${shipping.status} IN ('dispatched', 'in-transit')`,
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

// Shipping with related Order (and order details)
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
