import db from "../Drizzle/db";
import { shops } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { TIShop } from "../Drizzle/schema";
import type { Express } from "express";
import { uploadToCloudinary } from "../utils/upload";

// // CREATE
// export const createShopService = (data: TIShop) => {
//   return db.insert(shops).values(data).returning();
// };

interface ICreateShopInput {
  name: string;
  description?: string;
  location?: string;
  ownerId: number;
  logoFile?: Express.Multer.File;
  coverFile?: Express.Multer.File;
}

export const createShopService = async (data: ICreateShopInput) => {
  let logoUrl: string | undefined = undefined;
  let coverUrl: string | undefined = undefined;

  // Upload files to Cloudinary if they exist
  if (data.logoFile) {
    logoUrl = await uploadToCloudinary(data.logoFile);
  }

  if (data.coverFile) {
    coverUrl = await uploadToCloudinary(data.coverFile);
  }

  // Insert into shops table
  const shop = await db
    .insert(shops)
    .values({
      name: data.name,
      description: data.description,
      location: data.location,
      ownerId: data.ownerId,
      logoUrl,
      coverUrl,
      // status and rating will use defaults from schema
    })
    .returning();

  return shop;
};

// READ ALL
export const getAllShopsService = () => {
  return db.query.shops.findMany({
    with: {
      owner: true,
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
      owner: true,
      products: true,
      orderItems: true,
    },
  });
};

//READ BY OWNER 
export const getShopsByOwnerService = (ownerId: number) => {
  return db.query.shops.findMany({
    where: eq(shops.ownerId, ownerId),
    with: {
      products: true,
      orderItems: true,
    },
  });
};

//UPDATE
export const updateShopService = (id: number, data: Partial<TIShop>) => {
  return db.update(shops).set(data).where(eq(shops.id, id)).returning();
};

// DELETE
export const deleteShopService = (id: number) => {
  return db.delete(shops).where(eq(shops.id, id)).returning();
};


// Shop with Products
export const getShopWithProductsService = (id: number) => {
  return db.query.shops.findFirst({
    where: eq(shops.id, id),
    with: {
      products: true,
    },
  });
};

// Shop with Orders
export const getShopWithOrdersService = (id: number) => {
  return db.query.shops.findFirst({
    where: eq(shops.id, id),
    with: {
      orderItems: true,
    },
  });
};
