import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { TICart, TSCart, carts, cartItems, products } from "../Drizzle/schema";

// Create Cart
export const createCartService = async (cart: TICart) => {
  await db.insert(carts).values(cart);
  return "Cart created successfully";
};

// Get all Carts
export const getCartsService = async () => {
  return await db.query.carts.findMany();
};

// Get Cart by ID
export const getCartByIdService = async (id: number) => {
  return await db.query.carts.findFirst({
    where: eq(carts.id, id),
  });
};

// Update Cart
export const updateCartService = async (id: number, cart: Partial<TICart>) => {
  const updatedCart = await db
    .update(carts)
    .set(cart)
    .where(eq(carts.id, id))
    .returning();

  if (updatedCart.length === 0) {
    return null;
  }
  return "Cart updated successfully";
};

// Delete Cart
export const deleteCartService = async (id: number) => {
  const deletedCart = await db.delete(carts).where(eq(carts.id, id)).returning();

  if (deletedCart.length === 0) {
    return null;
  }
  return "Cart deleted successfully";
};

// Add Item to Cart
export const addCartItemService = async (
  cartId: number,
  productId: number,
  quantity: number
) => {
  await db.insert(cartItems).values({
    cartId,
    productId,
    quantity,
  });
  return "Item added to cart successfully";
};

// Update Cart Item Quantity
export const updateCartItemService = async (
  itemId: number,
  quantity: number
) => {
  const updatedItem = await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, itemId))
    .returning();

  if (updatedItem.length === 0) {
    return null;
  }
  return "Cart item updated successfully";
};

// Remove Cart Item
export const removeCartItemService = async (itemId: number) => {
  const deletedItem = await db
    .delete(cartItems)
    .where(eq(cartItems.id, itemId))
    .returning();

  if (deletedItem.length === 0) {
    return null;
  }
  return "Cart item removed successfully";
};

// Get Cart with Items
export const getCartWithItemsService = async (cartId: number) => {
  return await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
    with: {
      items: { with: { product: true } },
    },
  });
};

// Get All Carts with Items
export const getCartsWithItemsService = async () => {
  return await db.query.carts.findMany({
    with: {
      items: { with: { product: true } },
    },
  });
};

