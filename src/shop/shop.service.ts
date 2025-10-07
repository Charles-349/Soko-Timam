import db from "../Drizzle/db";
import { shops } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { TIShop } from "../Drizzle/schema";
import type { Express } from "express";
import { uploadToCloudinary } from "../utils/upload";
import cloudinary from "../utils/cloudinary";

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
  let logoUrl: string | undefined;
  let coverUrl: string | undefined;

  // Upload files to Cloudinary if they exist
  if (data.logoFile) {
    const logoResult = await cloudinary.uploader.upload(data.logoFile.path);
    logoUrl = logoResult.secure_url;
  }

  if (data.coverFile) {
    const coverResult = await cloudinary.uploader.upload(data.coverFile.path);
    coverUrl = coverResult.secure_url;
  }

  // Insert shop into DB
  const insertedShops = await db
    .insert(shops)
    .values({
      name: data.name,
      description: data.description,
      location: data.location,
      ownerId: data.ownerId,
      logoUrl,
      coverUrl,
    })
    .returning();

  return insertedShops[0]; // return first inserted row
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
