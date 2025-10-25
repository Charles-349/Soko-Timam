
import { eq, and } from "drizzle-orm";
import db from "../Drizzle/db";
import { TICart, carts, cartItems, products } from "../Drizzle/schema";

// export const createCartService = async (cart: TICart) => {
//   // Check if the user already has an unpaid cart
//   const existingCart = await db.query.carts.findFirst({
//     where: and(eq(carts.userId, cart.userId), eq(carts.checkoutStatus, "unpaid")),
//   });

//   if (existingCart) {
//     return { cart: existingCart, isNew: false }; // Reused existing unpaid cart
//   }

//   // Otherwise create a new cart
//   const [newCart] = await db.insert(carts).values(cart).returning();
//   return { cart: newCart, isNew: true };
// };


export const createOrAddToCartService = async (
  userId: number,
  items: { productId: number; quantity: number }[]
) => {
  // Check if the user already has an unpaid cart
  let cart = await db.query.carts.findFirst({
    where: and(eq(carts.userId, userId), eq(carts.checkoutStatus, "unpaid")),
  });

  // Create a new cart if none exists
  if (!cart) {
    const [newCart] = await db
      .insert(carts)
      .values({ userId, checkoutStatus: "unpaid" })
      .returning();
    cart = newCart;
  }

  //Loop through all incoming items
  for (const { productId, quantity } of items) {
    const existingItem = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
    });

    if (existingItem) {
      // Update existing item quantity
      await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        quantity,
      });
    }
  }

  //Return full cart with items
  const updatedCart = await db.query.carts.findFirst({
    where: eq(carts.id, cart.id),
    with: { items: { with: { product: true } } },
  });

  return { cart: updatedCart };
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
// export const addCartItemService = async (
//   userId: number,
//   productId: number,
//   quantity: number
// ) => {
//   //Check if user has an unpaid cart
//   let cart = await db.query.carts.findFirst({
//     where: and(eq(carts.userId, userId), eq(carts.checkoutStatus, "unpaid")),
//   });

//   //If no unpaid cart, create one
//   if (!cart) {
//     const [newCart] = await db
//       .insert(carts)
//       .values({ userId, checkoutStatus: "unpaid" })
//       .returning();
//     cart = newCart;
//   }

//   //Check if the item already exists in that cart
//   const existingItem = await db.query.cartItems.findFirst({
//     where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
//   });

//   if (existingItem) {
//     //If exists, update the quantity
//     await db
//       .update(cartItems)
//       .set({ quantity: existingItem.quantity + quantity })
//       .where(eq(cartItems.id, existingItem.id));
//     return "Cart item quantity updated successfully";
//   }

//   //Otherwise add new item
//   await db.insert(cartItems).values({
//     cartId: cart.id,
//     productId,
//     quantity,
//   });

//   return "Item added to cart successfully";
// };

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


