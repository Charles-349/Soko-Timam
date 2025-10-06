import { eq, sql, and, gt, lt } from "drizzle-orm";
import db from "../Drizzle/db";
import { flashSales, products, TIFlashSale } from "../Drizzle/schema";

// Create Flash Sale
export const createFlashSaleService = async (flashSale: any) => {
  const data = {
    ...flashSale,
    startTime: new Date(flashSale.startTime),
    endTime: new Date(flashSale.endTime),
  };

  await db.insert(flashSales).values(data);
  return "Flash sale created successfully";
};


// Get All Flash Sales
export const getFlashSalesService = async () => {
  return await db.query.flashSales.findMany({
    with: {
      product: true,
    },
  });
};

// Get Flash Sale by ID
export const getFlashSaleByIdService = async (id: number) => {
  return await db.query.flashSales.findFirst({
    where: eq(flashSales.id, id),
    with: {
      product: true,
    },
  });
};

// Get Active Flash Sales
export const getActiveFlashSalesService = async () => {
  const now = new Date();

  const activeSales = await db.query.flashSales.findMany({
    where: and(
      eq(flashSales.status, "active"), 
      lt(flashSales.startTime, now),
      gt(flashSales.endTime, now)
    ),
    with: {
      product: true, 
    },
    orderBy: flashSales.startTime,
  });

  return activeSales;
};

// Get Upcoming Flash Sales
export const getUpcomingFlashSalesService = async () => {
  const now = new Date();
  return await db.query.flashSales.findMany({
    where: and(eq(flashSales.status, "upcoming"), gt(flashSales.startTime, now)),
    with: {
      product: true,
    },
  });
};

// Get Ended Flash Sales
export const getEndedFlashSalesService = async () => {
  const now = new Date();
  return await db.query.flashSales.findMany({
    where: and(eq(flashSales.status, "ended"), lt(flashSales.endTime, now)),
    with: {
      product: true,
    },
  });
};

// Update Flash Sale
export const updateFlashSaleService = async (
  id: number,
  flashSale: Partial<TIFlashSale>
) => {
  const updatedFlashSale = await db
    .update(flashSales)
    .set(flashSale)
    .where(eq(flashSales.id, id))
    .returning();

  if (updatedFlashSale.length === 0) return null;
  return "Flash sale updated successfully";
};

// Delete Flash Sale
export const deleteFlashSaleService = async (id: number) => {
  const deletedFlashSale = await db
    .delete(flashSales)
    .where(eq(flashSales.id, id))
    .returning();

  if (deletedFlashSale.length === 0) return null;
  return "Flash sale deleted successfully";
};

// Flash Sale with Product Details
export const getFlashSaleWithProductService = async (id: number) => {
  return await db.query.flashSales.findFirst({
    where: eq(flashSales.id, id),
    with: {
      product: true,
    },
  });
};

// Automatically Update Flash Sale Status 
export const updateFlashSaleStatusesService = async () => {
  const now = new Date();

  // Activate sales that should now be active
  await db
    .update(flashSales)
    .set({ status: "active" })
    .where(and(eq(flashSales.status, "upcoming"), lt(flashSales.startTime, now)));

  // End sales that have expired
  await db
    .update(flashSales)
    .set({ status: "ended" })
    .where(and(eq(flashSales.status, "active"), lt(flashSales.endTime, now)));
};
