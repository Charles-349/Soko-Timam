import db from "../Drizzle/db"; 
import { eq, and, inArray } from "drizzle-orm";
import { orders, orderItems, products, payments, shops } from "../Drizzle/schema";
import type { TIOrder, TIOrderItem } from "../Drizzle/schema";

//Helper: Calculate total order amount
const calculateTotalAmount = async (orderId: number) => {
  const items = await db
    .select({
      price: orderItems.price,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  await db.update(orders).set({ totalAmount: String(total) }).where(eq(orders.id, orderId));
  return total;
};

//Create or update existing unpaid order and order items
export const createOrUpdateOrderService = async (
  userId: number,
  items: { productId: number; quantity: number }[],
  shippingAddress: string
) => {
  //Find existing unpaid order
  let existingOrder = await db.query.orders.findFirst({
    where: and(eq(orders.userId, userId), eq(orders.paymentStatus, "unpaid")),
  });

  //If none exists, create a new order
  if (!existingOrder) {
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId,
        paymentStatus: "unpaid",
        status: "pending",
        totalAmount: "0",
        shippingAddress,
      })
      .returning();

    existingOrder = newOrder;
  }

  //Add or update each item in order_items
  for (const { productId, quantity } of items) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Check if item already exists in this order
    const existingItem = await db.query.orderItems.findFirst({
      where: and(eq(orderItems.orderId, existingOrder.id), eq(orderItems.productId, productId)),
    });

    if (existingItem) {
      // Update quantity
      await db
        .update(orderItems)
        .set({
          quantity: existingItem.quantity + quantity,
          price: product.price,
        })
        .where(eq(orderItems.id, existingItem.id));
    } else {
      // Create new item
      await db.insert(orderItems).values({
        orderId: existingOrder.id,
        productId,
        shopId: product.shopId,
        quantity,
        price: product.price,
      });
    }
  }

  //Recalculate total
  const totalAmount = await calculateTotalAmount(existingOrder.id);

  return {
    message: "Order updated successfully",
    orderId: existingOrder.id,
    totalAmount,
  };
};

//Get all orders
export const getAllOrdersService = async () => {
  return await db.query.orders.findMany({
    with: {
      user: true,
      items: {
        with: {
          product: true,
        },
      },
      payments: true,
      shipping: true,
    },
  });
};

//Get order by ID
export const getOrderByIdService = async (orderId: number) => {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: {
        with: {
          product: true,
        },
      },
      payments: true,
      shipping: true,
    },
  });

  if (!order) throw new Error("Order not found");
  return order;
};

//Cancel unpaid order
export const cancelOrderService = async (orderId: number, userId: number) => {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
  });

  if (!order) throw new Error("Order not found");
  if (order.paymentStatus !== "unpaid") throw new Error("Cannot cancel a paid order");

  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  await db.delete(orders).where(eq(orders.id, orderId));

  return { message: "Order cancelled successfully" };
};

// Mark order as paid

export const markOrderAsPaidService = async (orderId: number, transactionRef: string) => {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) throw new Error("Order not found");

  // Update payment
  const [payment] = await db
    .insert(payments)
    .values({
      orderId: order.id,
      method: "mpesa",
      amount: order.totalAmount,
      status: "paid",
      transactionRef,
    })
    .returning();

  // Update order status
  await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      status: "paid",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  return { message: "Order marked as paid", payment };
};

//Get Orders by User ID
export const getOrdersByUserIdService = async (userId: number) => {
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      items: {
        with: {
          product: true,
        },
      },
      payments: true,
      shipping: true,
    },
  });

  if (!userOrders || userOrders.length === 0) {
    throw new Error("No orders found for this user");
  }

  return userOrders;
};

//get orders by seller id
export const getOrdersBySellerIdService = async (sellerId: number) => {
  // Find all shops owned by the seller
  const sellerShops = await db
    .select({ id: shops.id, name: shops.name })
    .from(shops)
    .where(eq(shops.sellerId, sellerId));

  if (sellerShops.length === 0) {
    console.log(" No shops found for this seller");
    return [];
  }

  const shopIds = sellerShops.map((shop) => shop.id);

  // Find all order items belonging to those shops
  const sellerOrderItems = await db
    .select({
      orderId: orderItems.orderId,
      orderItemId: orderItems.id,
      productId: orderItems.productId,
      shopId: orderItems.shopId,
      quantity: orderItems.quantity,
      price: orderItems.price,
    })
    .from(orderItems)
    .where(inArray(orderItems.shopId, shopIds));

  if (sellerOrderItems.length === 0) {
    console.log(" No order items found for these shops");
    return [];
  }

  //Extract unique order IDs
  const orderIds = [...new Set(sellerOrderItems.map((item) => item.orderId))];

  //Fetch all orders related to those items
  const sellerOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(inArray(orders.id, orderIds));

  //Combine orders with their order items
  const combined = sellerOrders.map((order) => ({
    ...order,
    items: sellerOrderItems.filter((item) => item.orderId === order.id),
  }));

  return combined;
};
