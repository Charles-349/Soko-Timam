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

  const activeSales = await db
    .select({
      id: flashSales.id,
      discountPercent: flashSales.discountPercent,
      discountPrice: flashSales.discountPrice,
      stockLimit: flashSales.stockLimit,
      soldCount: flashSales.soldCount,
      startTime: flashSales.startTime,
      endTime: flashSales.endTime,
      status: flashSales.flash_sale_status,
      createdAt: flashSales.createdAt,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        imageUrl: products.ImageUrl,
      },
    })
    .from(flashSales)
    .innerJoin(products, eq(products.id, flashSales.productId))
    .where(
      and(
        eq(flashSales.flash_sale_status, "active"),
        lt(flashSales.startTime, now),
        gt(flashSales.endTime, now)
      )
    )
    .orderBy(flashSales.startTime);

  return activeSales;
};

// Get Upcoming Flash Sales
// export const getUpcomingFlashSalesService = async () => {
//   const now = new Date();
//   return await db.query.flashSales.findMany({
//     where: and(eq(flashSales.flash_sale_status, "upcoming"), gt(flashSales.startTime, now)),
//     with: {
//       product: true,
//     },
//   });
// };

// Get Ended Flash Sales
export const getEndedFlashSalesService = async () => {
  const now = new Date();
  return await db.query.flashSales.findMany({
    where: and(eq(flashSales.flash_sale_status, "ended"), lt(flashSales.endTime, now)),
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
    .set({flash_sale_status: "active" })
    .where(and(eq(flashSales.flash_sale_status, "upcoming"), lt(flashSales.startTime, now)));

  // End sales that have expired
  await db
    .update(flashSales)
    .set({ flash_sale_status: "ended" })
    .where(and(eq(flashSales.flash_sale_status, "active"), lt(flashSales.endTime, now)));
};

//get upcoming flashsales
export const getUpcomingFlashSalesServiceV2 = async () => {
  const now = new Date();

  const upcomingSales = await db
    .select({
      id: flashSales.id,
      discountPercent: flashSales.discountPercent,
      discountPrice: flashSales.discountPrice,
      stockLimit: flashSales.stockLimit,
      soldCount: flashSales.soldCount,
      startTime: flashSales.startTime,
      endTime: flashSales.endTime,
      status: flashSales.flash_sale_status,
      createdAt: flashSales.createdAt,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        imageUrl: products.ImageUrl,
      },
    })
    .from(flashSales)
    .innerJoin(products, eq(products.id, flashSales.productId))
    .where(
      and(
        eq(flashSales.flash_sale_status, "upcoming"),
        gt(flashSales.startTime, now)
      )
    )
    .orderBy(flashSales.startTime);

  return upcomingSales;
};
