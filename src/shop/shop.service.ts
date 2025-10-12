// import db from "../Drizzle/db";
// import { shops } from "../Drizzle/schema";
// import { eq } from "drizzle-orm";
// import type { TIShop } from "../Drizzle/schema";
// import { uploadToCloudinary } from "../utils/upload";




// export interface ICreateShopInput {
//   name: string;
//   description?: string;
//   location?: string;
//   ownerId: number;
//   logoFile?: Express.Multer.File;
//   coverFile?: Express.Multer.File;
// }

// export const createShopService = async (data: ICreateShopInput) => {
//   let logoUrl: string | undefined;
//   let coverUrl: string | undefined;

//   // Upload files if provided
//   if (data.logoFile) {
//     logoUrl = await uploadToCloudinary(data.logoFile);
//   }

//   if (data.coverFile) {
//     coverUrl = await uploadToCloudinary(data.coverFile);
//   }

//   // Insert shop into DB
//   const insertedShops = await db
//     .insert(shops)
//     .values({
//       name: data.name,
//       description: data.description,
//       location: data.location,
//       ownerId: data.ownerId,
//       logoUrl,
//       coverUrl,
//     })
//     .returning();

//   return insertedShops[0]; 
// };

// // READ ALL
// export const getAllShopsService = () => {
//   return db.query.shops.findMany({
//     with: {
//       owner: true,
//       products: true,
//       orderItems: true,
//     },
//   });
// };

// // READ ONE 
// export const getShopByIdService = (id: number) => {
//   return db.query.shops.findFirst({
//     where: eq(shops.id, id),
//     with: {
//       owner: true,
//       products: true,
//       orderItems: true,
//     },
//   });
// };

// //READ BY OWNER 
// export const getShopsByOwnerService = (ownerId: number) => {
//   return db.query.shops.findMany({
//     where: eq(shops.sellerId, sellerId),
//     with: {
//       products: true,
//       orderItems: true,
//     },
//   });
// };

// //UPDATE
// export const updateShopService = (id: number, data: Partial<TIShop>) => {
//   return db.update(shops).set(data).where(eq(shops.id, id)).returning();
// };

// // DELETE
// export const deleteShopService = (id: number) => {
//   return db.delete(shops).where(eq(shops.id, id)).returning();
// };


// // Shop with Products
// export const getShopWithProductsService = (id: number) => {
//   return db.query.shops.findFirst({
//     where: eq(shops.id, id),
//     with: {
//       products: true,
//     },
//   });
// };

// // Shop with Orders
// export const getShopWithOrdersService = (id: number) => {
//   return db.query.shops.findFirst({
//     where: eq(shops.id, id),
//     with: {
//       orderItems: true,
//     },
//   });
// };
import db from "../Drizzle/db";
import { shops } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { TIShop } from "../Drizzle/schema";
import { uploadToCloudinary } from "../utils/upload";

export interface ICreateShopInput {
  sellerId: number; 
  name: string;
  description?: string;
  address?: string;
  city?: string;
  primaryCategory: string;
  businessType: string;
  productCategories?: string[];
  businessRegistrationNumber?: string;
  kraPin?: string;
  taxId?: string;
  postalCode?: string;
  expectedMonthlyOrders?: number;
  logoFile?: Express.Multer.File;
}

export const createShopService = async (data: ICreateShopInput) => {
  let logoUrl: string | undefined;

  // Upload logo if provided
  if (data.logoFile) {
    logoUrl = await uploadToCloudinary(data.logoFile);
  }

  // 
  const productCategories = Array.isArray(data.productCategories)
    ? data.productCategories
    : [];

  // Insert shop into DB
  const insertedShops = await db
    .insert(shops)
    .values({
      sellerId: data.sellerId,
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      primaryCategory: data.primaryCategory,
      businessType: data.businessType,
      productCategories,
      businessRegistrationNumber: data.businessRegistrationNumber,
      kraPin: data.kraPin,
      taxId: data.taxId,
      postalCode: data.postalCode,
      expectedMonthlyOrders: data.expectedMonthlyOrders ?? null,
      logoUrl,
    })
    .returning();

  return insertedShops[0];
};

// READ ALL
export const getAllShopsService = () => {
  return db.query.shops.findMany({
    with: {
      seller: true,
      products: true,
      orderItems: true,
    },
  });
};

// READ ONE
export const getShopByIdService = (id: number) => {
  return db.query.shops.findFirst({
    where: eq(shops.id, id),
    with: {
      seller: true,
      products: true,
      orderItems: true,
    },
  });
};

// READ BY SELLER
export const getShopsBySellerService = (sellerId: number) => {
  return db.query.shops.findMany({
    where: eq(shops.sellerId, sellerId),
    with: {
      products: true,
      orderItems: true,
    },
  });
};

// UPDATE
export const updateShopService = (id: number, data: Partial<TIShop>) => {
  return db.update(shops).set(data).where(eq(shops.id, id)).returning();
};

// DELETE
export const deleteShopService = (id: number) => {
  return db.delete(shops).where(eq(shops.id, id)).returning();
};

// SHOP WITH PRODUCTS
export const getShopWithProductsService = (id: number) => {
  return db.query.shops.findFirst({
    where: eq(shops.id, id),
    with: {
      products: true,
    },
  });
};

// SHOP WITH ORDERS
export const getShopWithOrdersService = (id: number) => {
  return db.query.shops.findFirst({
    where: eq(shops.id, id),
    with: {
      orderItems: true,
    },
  });
};
