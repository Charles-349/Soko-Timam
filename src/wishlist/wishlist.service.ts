import { eq } from "drizzle-orm";
import db from "../Drizzle/db";
import { wishlists, TIWishlist } from "../Drizzle/schema";

// Create Wishlist Entry
export const createWishlistService = async (wishlist: TIWishlist) => {
  await db.insert(wishlists).values(wishlist);
  return "Wishlist item added successfully";
};

// Get All Wishlists
export const getWishlistsService = async () => {
  return await db.query.wishlists.findMany({
    with: { user: true, product: true },
  });
};

// Get Wishlist by ID
export const getWishlistByIdService = async (id: number) => {
  return await db.query.wishlists.findFirst({
    where: eq(wishlists.id, id),
    with: { user: true, product: true },
  });
};

// Update Wishlist Entry
export const updateWishlistService = async (
  id: number,
  wishlist: Partial<TIWishlist>
) => {
  const updatedWishlist = await db
    .update(wishlists)
    .set(wishlist)
    .where(eq(wishlists.id, id))
    .returning();

  if (updatedWishlist.length === 0) {
    return null;
  }
  return "Wishlist updated successfully";
};

// Delete Wishlist Entry
export const deleteWishlistService = async (id: number) => {
  const deletedWishlist = await db
    .delete(wishlists)
    .where(eq(wishlists.id, id))
    .returning();

  if (deletedWishlist.length === 0) {
    return null;
  }
  return "Wishlist item deleted successfully";
};
// Wishlist with User
export const getWishlistWithUserService = async (id: number) => {
  return await db.query.wishlists.findFirst({
    where: eq(wishlists.id, id),
    with: { user: true, product: true },
  });
};

// Wishlist with Product
export const getWishlistWithProductService = async (id: number) => {
  return await db.query.wishlists.findFirst({
    where: eq(wishlists.id, id),
    with: { product: true, user: true },
  });
};

// Wishlist by User (all products a user saved)
export const getWishlistsByUserService = async (userId: number) => {
  return await db.query.wishlists.findMany({
    where: eq(wishlists.userId, userId),
    with: { product: true },
  });
};
