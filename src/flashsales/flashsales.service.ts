
import { eq, and, gt, lt } from "drizzle-orm";
import db from "../Drizzle/db";
import { flashSales, products, shops, TIFlashSale } from "../Drizzle/schema";
import { sql } from "drizzle-orm";

//convert date strings safely to Date objects 
const toDate = (date: string | Date) => new Date(date);

//Create Flash Sale
// export const createFlashSaleService = async (flashSale: any) => {
//   const data = {
//     ...flashSale,
//     startTime: toDate(flashSale.startTime),
//     endTime: toDate(flashSale.endTime),
//   };

//   await db.insert(flashSales).values(data);
//   return "Flash sale created successfully";
// };

export const createFlashSaleService = async (flashSale: any) => {
  //Get product price
  const product = await db.query.products.findFirst({
    where: eq(products.id, flashSale.productId),
  });

  if (!product) {
    throw new Error("Product not found");
  }

  //Calculate discountPercent automatically
  const originalPrice = Number(product.price);
  const discountedPrice = Number(flashSale.discountPrice);

  if (discountedPrice >= originalPrice) {
    throw new Error("Discounted price must be lower than the product price");
  }

  const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

  //Prepare data for insertion
  const data = {
    ...flashSale,
    discountPercent,
    startTime: toDate(flashSale.startTime),
    endTime: toDate(flashSale.endTime),
  };

  // Save to DB
  await db.insert(flashSales).values(data);
//Hide product from main products list during flash sale
    await db
    .update(products)
    .set({ onFlashSale: true }) 
    .where(eq(products.id, flashSale.productId));

  return {
    message: "Flash sale created successfully",
    discountPercent,
  };
};

//Get All Flash Sales
export const getFlashSalesService = async () => {
  return await db.query.flashSales.findMany({
    with: {
      product: true,
    },
  });
};

//Get Flash Sale by ID
export const getFlashSaleByIdService = async (id: number) => {
  return await db.query.flashSales.findFirst({
    where: eq(flashSales.id, id),
    with: {
      product: true,
    },
  });
};

//Get Active Flash Sales
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

//Get Ended Flash Sales
export const getEndedFlashSalesService = async () => {
  const now = new Date();
  return await db.query.flashSales.findMany({
    where: and(eq(flashSales.flash_sale_status, "ended"), lt(flashSales.endTime, now)),
    with: {
      product: true,
    },
  });
};

//Update Flash Sale
export const updateFlashSaleService = async (
  id: number,
  flashSale: Partial<TIFlashSale>
) => {
  const updatedFlashSale = {
    ...flashSale,
    startTime: flashSale.startTime ? toDate(flashSale.startTime) : undefined,
    endTime: flashSale.endTime ? toDate(flashSale.endTime) : undefined,
  };

  const result = await db
    .update(flashSales)
    .set(updatedFlashSale)
    .where(eq(flashSales.id, id))
    .returning();

  if (result.length === 0) return null;
  return "Flash sale updated successfully";
};

//Delete Flash Sale
export const deleteFlashSaleService = async (id: number) => {
  const deletedFlashSale = await db
    .delete(flashSales)
    .where(eq(flashSales.id, id))
    .returning();

  if (deletedFlashSale.length === 0) return null;
  return "Flash sale deleted successfully";
};

//Flash Sale with Product Details
export const getFlashSaleWithProductService = async (id: number) => {
  return await db.query.flashSales.findFirst({
    where: eq(flashSales.id, id),
    with: {
      product: true,
    },
  });
};

//Automatically Update Flash Sale Status
// export const updateFlashSaleStatusesService = async () => {
//   const now = new Date();

//   // Activate sales that should now be active
//   await db
//     .update(flashSales)
//     .set({ flash_sale_status: "active" })
//     .where(and(eq(flashSales.flash_sale_status, "upcoming"), lt(flashSales.startTime, now)));

//   // End sales that have expired
//   await db
//     .update(flashSales)
//     .set({ flash_sale_status: "ended" })
//     .where(and(eq(flashSales.flash_sale_status, "active"), lt(flashSales.endTime, now)));

// //Delete ended flash sales and restore product visibility
//   const endedSales = await db
//     .delete(flashSales)
//     .where(
//       and(
//         eq(flashSales.flash_sale_status, "ended"),
//         lt(flashSales.endTime, now)
//       )
//     )
//     .returning({ productId: flashSales.productId });

//   // Restore products to normal listing
//   for (const sale of endedSales) {
//     await db
//       .update(products)
//       .set({ onFlashSale: false })
//       .where(eq(products.id, sale.productId));
//   }
// };

export const updateFlashSaleStatusesService = async () => {
  const nowSQL = sql`NOW()`; 

  // Activate flash sales that should now be active
  const activated = await db
    .update(flashSales)
    .set({ flash_sale_status: "active" })
    .where(
      and(
        eq(flashSales.flash_sale_status, "upcoming"),
        lt(flashSales.startTime, nowSQL)
      )
    )
    .returning({ id: flashSales.id });

  // Mark as ended flash sales that have expired
  const ended = await db
    .update(flashSales)
    .set({ flash_sale_status: "ended" })
    .where(
      and(
        eq(flashSales.flash_sale_status, "active"),
        lt(flashSales.endTime, nowSQL)
      )
    )
    .returning({ id: flashSales.id });

  // Delete flash sales that have ended
  const deleted = await db
    .delete(flashSales)
    .where(
      and(
        eq(flashSales.flash_sale_status, "ended"),
        lt(flashSales.endTime, nowSQL)
      )
    )
    .returning({ productId: flashSales.productId });

  console.log(
    `Flash sale cleanup complete. Activated: ${activated.length}, Ended: ${ended.length}, Deleted: ${deleted.length}`
  );
};




//Get Upcoming Flash Sales 
export const getUpcomingFlashSalesService = async () => {
  const now = new Date();

  console.log("Fetching upcoming flash sales after:", now);

  const upcomingSales = await db
    .select({
      id: flashSales.id,
      productId: flashSales.productId,
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
    .leftJoin(products, eq(products.id, flashSales.productId))
    .where(
      and(
        gt(flashSales.startTime, now), // must start in the future
        eq(flashSales.flash_sale_status, "upcoming") // must be marked upcoming
      )
    )
    .orderBy(flashSales.startTime);

  console.log("Upcoming sales found:", upcomingSales.length);

  return upcomingSales;
};

//Get Flash Sales by Seller
export const getFlashSalesBySellerService = async (sellerId: number) => {
  return await db
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
        price: products.price,
        stock: products.stock,
        imageUrl: products.ImageUrl,
      },
    })
    .from(flashSales)
    .innerJoin(products, eq(flashSales.productId, products.id))
    .innerJoin(shops, eq(products.shopId, shops.id))
    .where(eq(shops.sellerId, sellerId))
    .orderBy(flashSales.startTime);
};
