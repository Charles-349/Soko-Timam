// import { eq, sql } from "drizzle-orm";
// import db from "../Drizzle/db";
// import { TICart, TSCart, carts, cartItems, products } from "../Drizzle/schema";

// // Create Cart
// export const createCartService = async (cart: TICart) => {
//   await db.insert(carts).values(cart);
//   return "Cart created successfully";
// };

// // Get all Carts
// export const getCartsService = async () => {
//   return await db.query.carts.findMany();
// };

// // Get Cart by ID
// export const getCartByIdService = async (id: number) => {
//   return await db.query.carts.findFirst({
//     where: eq(carts.id, id),
//   });
// };

// // Update Cart
// export const updateCartService = async (id: number, cart: Partial<TICart>) => {
//   const updatedCart = await db
//     .update(carts)
//     .set(cart)
//     .where(eq(carts.id, id))
//     .returning();

//   if (updatedCart.length === 0) {
//     return null;
//   }
//   return "Cart updated successfully";
// };

// // Delete Cart
// export const deleteCartService = async (id: number) => {
//   const deletedCart = await db.delete(carts).where(eq(carts.id, id)).returning();

//   if (deletedCart.length === 0) {
//     return null;
//   }
//   return "Cart deleted successfully";
// };

// // Add Item to Cart
// export const addCartItemService = async (
//   cartId: number,
//   productId: number,
//   quantity: number
// ) => {
//   await db.insert(cartItems).values({
//     cartId,
//     productId,
//     quantity,
//   });
//   return "Item added to cart successfully";
// };

// // Update Cart Item Quantity
// export const updateCartItemService = async (
//   itemId: number,
//   quantity: number
// ) => {
//   const updatedItem = await db
//     .update(cartItems)
//     .set({ quantity })
//     .where(eq(cartItems.id, itemId))
//     .returning();

//   if (updatedItem.length === 0) {
//     return null;
//   }
//   return "Cart item updated successfully";
// };

// // Remove Cart Item
// export const removeCartItemService = async (itemId: number) => {
//   const deletedItem = await db
//     .delete(cartItems)
//     .where(eq(cartItems.id, itemId))
//     .returning();

//   if (deletedItem.length === 0) {
//     return null;
//   }
//   return "Cart item removed successfully";
// };

// // Get Cart with Items
// export const getCartWithItemsService = async (cartId: number) => {
//   return await db.query.carts.findFirst({
//     where: eq(carts.id, cartId),
//     with: {
//       items: { with: { product: true } },
//     },
//   });
// };

// // Get All Carts with Items
// export const getCartsWithItemsService = async () => {
//   return await db.query.carts.findMany({
//     with: {
//       items: { with: { product: true } },
//     },
//   });
// };

import { eq, and } from "drizzle-orm";
import db from "../Drizzle/db";
import { TICart, carts, cartItems, products } from "../Drizzle/schema";

//Create or Reuse Cart (ensures only one unpaid cart per user)
// export const createCartService = async (cart: TICart) => {
//   // Check if the user already has an unpaid cart
//   const existingCart = await db.query.carts.findFirst({
//     where: and(eq(carts.userId, cart.userId), eq(carts.checkoutStatus, "unpaid")),
//   });

//   if (existingCart) {
//     return existingCart; // Return the same unpaid cart
//   }

//   // Otherwise create a new cart
//   const [newCart] = await db.insert(carts).values(cart).returning();
//   return newCart;
// };

export const createCartService = async (cart: TICart) => {
  // Check if the user already has an unpaid cart
  const existingCart = await db.query.carts.findFirst({
    where: and(eq(carts.userId, cart.userId), eq(carts.checkoutStatus, "unpaid")),
  });

  if (existingCart) {
    return { cart: existingCart, isNew: false }; // Reused existing unpaid cart
  }

  // Otherwise create a new cart
  const [newCart] = await db.insert(carts).values(cart).returning();
  return { cart: newCart, isNew: true };
};

//Get all Carts
export const getCartsService = async () => {
  return await db.query.carts.findMany();
};

//Get Cart by ID
export const getCartByIdService = async (id: number) => {
  return await db.query.carts.findFirst({ where: eq(carts.id, id) });
};

//Update Cart (e.g., mark as paid)
export const updateCartService = async (id: number, cart: Partial<TICart>) => {
  const updatedCart = await db.update(carts).set(cart).where(eq(carts.id, id)).returning();
  if (updatedCart.length === 0) return null;
  return "Cart updated successfully";
};

//Delete Cart
export const deleteCartService = async (id: number) => {
  const deletedCart = await db.delete(carts).where(eq(carts.id, id)).returning();
  if (deletedCart.length === 0) return null;
  return "Cart deleted successfully";
};

//Add Item to Cart
export const addCartItemService = async (
  userId: number,
  productId: number,
  quantity: number
) => {
  //Check if user has an unpaid cart
  let cart = await db.query.carts.findFirst({
    where: and(eq(carts.userId, userId), eq(carts.checkoutStatus, "unpaid")),
  });

  //If no unpaid cart, create one
  if (!cart) {
    const [newCart] = await db
      .insert(carts)
      .values({ userId, checkoutStatus: "unpaid" })
      .returning();
    cart = newCart;
  }

  //Check if the item already exists in that cart
  const existingItem = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
  });

  if (existingItem) {
    //If exists, update the quantity
    await db
      .update(cartItems)
      .set({ quantity: existingItem.quantity + quantity })
      .where(eq(cartItems.id, existingItem.id));
    return "Cart item quantity updated successfully";
  }

  //Otherwise add new item
  await db.insert(cartItems).values({
    cartId: cart.id,
    productId,
    quantity,
  });

  return "Item added to cart successfully";
};

// Update Cart Item Quantity
export const updateCartItemService = async (itemId: number, quantity: number) => {
  const updatedItem = await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, itemId))
    .returning();

  if (updatedItem.length === 0) return null;
  return "Cart item updated successfully";
};

// Remove Cart Item
export const removeCartItemService = async (itemId: number) => {
  const deletedItem = await db.delete(cartItems).where(eq(cartItems.id, itemId)).returning();
  if (deletedItem.length === 0) return null;
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

//Get All Carts with Items
export const getCartsWithItemsService = async () => {
  return await db.query.carts.findMany({
    with: {
      items: { with: { product: true } },
    },
  });
};


