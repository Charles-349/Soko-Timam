import db from "../Drizzle/db";
import { shops } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { TIShop } from "../Drizzle/schema";

// ---------------- CREATE ----------------
export const createShopService = (data: TIShop) => {
  return db.insert(shops).values(data).returning();
};

// ---------------- READ ALL ----------------
export const getAllShopsService = () => {
  return db.query.shops.findMany({
    with: {
      owner: true,
      products: true,
      orderItems: true,
    },
  });
};

// ---------------- READ ONE ----------------
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

// ---------------- READ BY OWNER ----------------
export const getShopsByOwnerService = (ownerId: number) => {
  return db.query.shops.findMany({
    where: eq(shops.ownerId, ownerId),
    with: {
      products: true,
      orderItems: true,
    },
  });
};

// ---------------- UPDATE ----------------
export const updateShopService = (id: number, data: Partial<TIShop>) => {
  return db.update(shops).set(data).where(eq(shops.id, id)).returning();
};

// ---------------- DELETE ----------------
export const deleteShopService = (id: number) => {
  return db.delete(shops).where(eq(shops.id, id)).returning();
};

// ---------------- RELATIONS ----------------

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
