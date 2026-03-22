// import db from "../Drizzle/db"; 
// import { eq, and, inArray } from "drizzle-orm";
// import { orders, orderItems, products, payments, shops, shipping, stations, agents, users, sellers, productImages } from "../Drizzle/schema";
// import type { TIOrder, TIOrderItem } from "../Drizzle/schema";
// import { sql } from "drizzle-orm";
// import { alias } from "drizzle-orm/pg-core";
// import { sendEmail } from "../mailer/mailer";
// import crypto from "crypto";

// //Helper: Calculate total order amount
// const calculateTotalAmount = async (orderId: number) => {
//   const items = await db
//     .select({
//       price: orderItems.price,
//       quantity: orderItems.quantity,
//     })
//     .from(orderItems)
//     .where(eq(orderItems.orderId, orderId));

//   const total = items.reduce(
//     (sum, item) => sum + Number(item.price) * Number(item.quantity),
//     0
//   );

//   await db.update(orders).set({ totalAmount: String(total) }).where(eq(orders.id, orderId));
//   return total;
// };

// //Create or update existing unpaid order and order items
// export const createOrUpdateOrderService = async (
//   userId: number,
//   items: { productId: number; quantity: number }[],
//   pickupStationId?: number | null, 
//   pickupAgentId?: number |null   
// ) => {
//   // Find existing unpaid order
//   let existingOrder = await db.query.orders.findFirst({
//     where: and(eq(orders.userId, userId), eq(orders.paymentStatus, "unpaid")),
//   });

//   // If none exists, create a new order
//   if (!existingOrder) {
//     const [newOrder] = await db
//       .insert(orders)
//       .values({
//         userId,
//         paymentStatus: "unpaid",
//         status: "pending",
//         totalAmount: "0",
//         pickupStationId: pickupStationId ?? null,
//         pickupAgentId: pickupAgentId ?? null,
//         originStationId: null, 
//       })
//       .returning();

//     existingOrder = newOrder;
//   } else {
//     // Update pickup info if customer changes selection
//     await db
//       .update(orders)
//       .set({
//         pickupStationId: pickupStationId ?? existingOrder.pickupStationId,
//         pickupAgentId: pickupAgentId ?? existingOrder.pickupAgentId,

//       })
//       .where(eq(orders.id, existingOrder.id));
//   }

//   // Add or update each item in order_items
//   for (const { productId, quantity } of items) {
//     const product = await db.query.products.findFirst({
//       where: eq(products.id, productId),
//     });

//     if (!product) {
//       throw new Error(`Product with ID ${productId} not found`);
//     }

//     const existingItem = await db.query.orderItems.findFirst({
//       where: and(
//         eq(orderItems.orderId, existingOrder.id),
//         eq(orderItems.productId, productId)
//       ),
//     });

//     if (existingItem) {
//       await db
//         .update(orderItems)
//         .set({
//           quantity: existingItem.quantity + quantity,
//           price: product.price,
//         })
//         .where(eq(orderItems.id, existingItem.id));
//     } else {
//       await db.insert(orderItems).values({
//         orderId: existingOrder.id,
//         productId,
//         shopId: product.shopId,
//         quantity,
//         price: product.price,
//       });
//     }
//   }

//   // Recalculate total
//   const totalAmount = await calculateTotalAmount(existingOrder.id);

//   return {
//     message: "Order updated successfully",
//     orderId: existingOrder.id,
//     totalAmount,
//     pickupStationId: existingOrder.pickupStationId ?? pickupStationId ?? null,
//     pickupAgentId: existingOrder.pickupAgentId ?? pickupAgentId ?? null,

//   };
// };


// //Get all orders
// export const getAllOrdersService = async () => {
//   return await db.query.orders.findMany({
//     with: {
//       user: true,
//       items: {
//         with: {
//           product: true,
//         },
//       },
//       payments: true,
//       shipping: true,
//     },
//   });
// };

// //Get order by ID
// export const getOrderByIdService = async (orderId: number) => {
//   const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//     with: {
//       items: {
//         with: {
//           product: true,
//         },
//       },
//       payments: true,
//       shipping: true,
//     },
//   });

//   if (!order) throw new Error("Order not found");
//   return order;
// };

// //Cancel unpaid order
// export const cancelOrderService = async (orderId: number, userId: number) => {
//   const order = await db.query.orders.findFirst({
//     where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
//   });

//   if (!order) throw new Error("Order not found");
//   if (order.paymentStatus !== "unpaid") throw new Error("Cannot cancel a paid order");

//   await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
//   await db.delete(orders).where(eq(orders.id, orderId));

//   return { message: "Order cancelled successfully" };
// };

// // Mark order as paid
// export const markOrderAsPaidService = async (orderId: number, transactionRef: string) => {
//   const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//   });

//   if (!order) throw new Error("Order not found");

//   // Update payment
//   const [payment] = await db
//     .insert(payments)
//     .values({
//       orderId: order.id,
//       method: "mpesa",
//       amount: order.totalAmount,
//       status: "paid",
//       transactionRef,
//     })
//     .returning();

//   // Update order status
//   await db
//     .update(orders)
//     .set({
//       paymentStatus: "paid",
//       status: "paid",
//       updatedAt: new Date(),
//     })
//     .where(eq(orders.id, order.id));

//   return { message: "Order marked as paid", payment };
// };

// //Get Orders by User ID
// export const getOrdersByUserIdService = async (userId: number) => {
//   const userOrders = await db.query.orders.findMany({
//     where: eq(orders.userId, userId),
//     with: {
//       items: {
//         with: {
//           product: true,
//         },
//       },
//       payments: true,
//       shipping: true,
//     },
//   });

//   if (!userOrders || userOrders.length === 0) {
//     throw new Error("No orders found for this user");
//   }

//   return userOrders;
// };

// //get orders by seller id
// export const getOrdersBySellerIdService = async (sellerId: number) => {
//   // Find all shops owned by the seller
//   const sellerShops = await db
//     .select({ id: shops.id, name: shops.name })
//     .from(shops)
//     .where(eq(shops.sellerId, sellerId));

//   if (sellerShops.length === 0) {
//     console.log("No shops found for this seller");
//     return [];
//   }

//   const shopIds = sellerShops.map((shop) => shop.id);

//   // Find all order items belonging to those shops
//   const sellerOrderItems = await db
//     .select({
//       orderId: orderItems.orderId,
//       orderItemId: orderItems.id,
//       productId: orderItems.productId,
//       shopId: orderItems.shopId,
//       quantity: orderItems.quantity,
//       price: orderItems.price,
//     })
//     .from(orderItems)
//     .where(inArray(orderItems.shopId, shopIds));

//   if (sellerOrderItems.length === 0) {
//     console.log("No order items found for these shops");
//     return [];
//   }

//   // Extract unique order IDs
//   const orderIds = [...new Set(sellerOrderItems.map((item) => item.orderId))];

//   //Fetch all orders related to those order IDs
//   const sellerOrders = await db
//     .select({
//       id: orders.id,
//       userId: orders.userId,
//       status: orders.status,
//       totalAmount: orders.totalAmount,
//       paymentStatus: orders.paymentStatus,
//       createdAt: orders.createdAt,
//       updatedAt: orders.updatedAt,
//     })
//     .from(orders)
//     .where(inArray(orders.id, orderIds));

//   // Fetch shipping details for those orders
//   const shippingDetails = await db
//     .select({
//       id: shipping.id,
//       orderId: shipping.orderId,
//       status: shipping.status,
//       originStationId: shipping.originStationId,
//       pickupStationId: shipping.pickupStationId,
//       pickupAgentId: shipping.pickupAgentId,
//       recipientName: shipping.recipientName,
//       recipientPhone: shipping.recipientPhone,
//       estimatedDelivery: shipping.estimatedDelivery,
//     })
//     .from(shipping)
//     .where(inArray(shipping.orderId, orderIds));

//   // Combine everything: orders + items + shipping
//   const combined = sellerOrders.map((order) => {
//     // Ensure shipping status is updated if order.status is shipped
//     const shippingRecord = shippingDetails.find((ship) => ship.orderId === order.id);

//     // If order is marked as shipped but no shipping record exists, create a temporary one in response
//     const shippingInfo =
//       shippingRecord ||
//       (order.status === "shipped"
//         ? {
//             orderId: order.id,
//             status: "dispatched",
//           }
//         : null);

//     return {
//       ...order,
//       items: sellerOrderItems.filter((item) => item.orderId === order.id),
//       shipping: shippingInfo,
//     };
//   });

//   return combined;
// };

// export const assignOriginStationService = async (
//   orderId: number,
//   stationId: number
// ) => {
//   // Check order exists
//   const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//   });

//   if (!order) throw new Error("Order not found");
//   if(order.status !== "paid") throw new Error("Only paid orders can be assigned an origin station");
//   // Update origin station
//   await db.update(orders)
//     .set({
//       originStationId: stationId,
//       status: "at_station", 
//       updatedAt: new Date(),
//     })
//     .where(eq(orders.id, orderId));

//   return {
//     message: "Origin station assigned successfully",
//     orderId,
//     stationId,
//   };
// };

// export const markOrderAsShippedService = async (orderId: number) => {
//   // Fetch the order
//   const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//   });

//   if (!order) throw new Error("Order not found");

//   if (order.status !== "at_station") throw new Error("Order must be assigned to a station to be marked as shipped");

//   // Update order status to shipped
//   await db.update(orders).set({ status: "shipped", updatedAt: new Date() }).where(eq(orders.id, orderId));

//   // Update shipping record if it exists
//   const shippingRecord = await db.query.shipping.findFirst({
//     where: eq(shipping.orderId, orderId),
//   });

//   if (shippingRecord) {
//     await db.update(shipping).set({ status: "in_transit" }).where(eq(shipping.id, shippingRecord.id));
//   } else {
//     //create a shipping record if none exists
//     await db.insert(shipping).values({
//       orderId,
//       status: "in_transit",
//       originStationId: order.originStationId || 0,
//     });
//   }

//   return { message: "Order marked as shipped", orderId };
// };

// //Mark order as ready for pickup
// export const markOrderAsReadyForPickupService = async (orderId: number) => {
//   // Fetch the order with customer info
//   const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//     with: { user: true },
//   });

//   if (!order) throw new Error("Order not found");

//   if (order.status !=="shipped") throw new Error("Only shipped orders can be marked as ready for pickup");

//   // Generate a random 6-character alphanumeric pickup code
//   const pickupCode = crypto.randomBytes(3).toString("hex").toUpperCase();

//   // Update shipping record if it exists
//   let shippingRecord = await db.query.shipping.findFirst({
//     where: eq(shipping.orderId, orderId),
//   });

//   if (shippingRecord) {
//     await db.update(shipping)
//       .set({ status: "ready_for_pickup", pickupCode })
//       .where(eq(shipping.id, shippingRecord.id));
//   } else {
//     // Create a shipping record if none exists
//     const inserted = await db.insert(shipping).values({
//       orderId,
//       status: "ready_for_pickup",
//       originStationId: order.originStationId || 0,
//       pickupCode,
//     }).returning();

//     shippingRecord = inserted[0];
//   }

//   // Send pickup code to customer's email 
//   if (order.user && !Array.isArray(order.user) && order.user.email) {
//     await sendEmail(
//       order.user.email,
//       "Your Order is Ready for Pickup",
//       `Hi ${order.user.firstname}, your order #${orderId} is ready for pickup. Pickup code: ${pickupCode}`,
//       `
//         <p>Hi ${order.user.firstname},</p>
//         <p>Your order <strong>#${orderId}</strong> is ready for pickup.</p>
//         <p><strong>Pickup Code:</strong> ${pickupCode}</p>
//         <p>Please present this code at the pickup station.</p>
//       `
//     );
//   }

//   return {
//     message: "Order marked as ready for pickup and code sent to customer",
//     orderId,
//     pickupCode,
//   };
// };

// //Mark order as delivered
// export const markOrderAsDeliveredService = async (orderId: number, providedCode: string) => {
//   // Fetch the order
//   const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//     with: { shipping: true }, 
//   });

//   if (!order) throw new Error("Order not found");

//   const shippingRecord = order.shipping[0];

//   if (!shippingRecord) throw new Error("Shipping record not found for this order");

//   // Verify the provided pickup code
//   if (!shippingRecord.pickupCode) throw new Error("No pickup code set for this order");
//   if (shippingRecord.pickupCode !== providedCode) throw new Error("Invalid pickup code");

//   if (shippingRecord.status !== "ready_for_pickup") throw new Error("Order is not ready for pickup, cannot be marked as delivered");
//   // Update order status to delivered
// const now = new Date();
// const returnWindowDays = 7; // configurable
// const returnWindowEnds = new Date(
// now.getTime() + returnWindowDays * 24 * 60 * 60 * 1000
// );

// await db.update(orders).set({
//   status: "completed",
//   deliveredAt: now,
//   returnWindowEndsAt: returnWindowEnds,
//   escrowReleaseAt: returnWindowEnds,
//   updatedAt: now,
// }).where(eq(orders.id, orderId));

//   // Update shipping status to delivered
//   await db.update(shipping)
//     .set({ 
//       status: "delivered",
//       deliveredAt: new Date(),
//     })
//     .where(eq(shipping.id, shippingRecord.id));

//   return { message: "Order successfully delivered", orderId };
// };


// //Get orders by agent id
// export const getOrdersByAgentIdService = async (agentId: number) => {
//   const sellerUser = alias(users, "sellerUser");

//   const rows = await db
//     .select({
//       // Order
//       orderId: orders.id,
//       userId: orders.userId,
//       status: orders.status,
//       totalAmount: orders.totalAmount,
//       paymentStatus: orders.paymentStatus,
//       createdAt: orders.createdAt,
//       updatedAt: orders.updatedAt,

//       // Customer
//       customerId: users.id,
//       customerName: users.firstname,

//       // Shop
//       shopId: shops.id,
//       shopName: shops.name,

//       // Seller
//       sellerId: sellers.id,
//       sellerName: sellerUser.firstname,

//       // Item
//       itemId: orderItems.id,
//       quantity: orderItems.quantity,
//       price: orderItems.price,

//       // Product
//       productId: products.id,
//       productName: products.name,
//       productDescription: products.description,
//       productImage: productImages.imageUrl,

//       // Shipping
//       shippingStatus: shipping.status,
//       recipientName: shipping.recipientName,
//       recipientPhone: shipping.recipientPhone,
//       estimatedDelivery: shipping.estimatedDelivery,
//     })
//     .from(shipping)
//     .innerJoin(orders, eq(shipping.orderId, orders.id))
//     .leftJoin(users, eq(orders.userId, users.id))
//     .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
//     .leftJoin(products, eq(orderItems.productId, products.id))
//      .leftJoin(
//       productImages,
//       and(
//         eq(productImages.productId, products.id),
//         eq(productImages.isMain, true)
//       )
//     )
//     .leftJoin(shops, eq(orderItems.shopId, shops.id))
//     .leftJoin(sellers, eq(shops.sellerId, sellers.id))
//     .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
//     .where(eq(shipping.pickupAgentId, agentId));

//   if (!rows.length) return [];

//   const orderMap = new Map<number, any>();

//   for (const row of rows) {
//     if (!orderMap.has(row.orderId)) {
//       orderMap.set(row.orderId, {
//         orderId: row.orderId,
//         userId: row.userId,
//         status: row.status,
//         totalAmount: row.totalAmount,
//         paymentStatus: row.paymentStatus,
//         createdAt: row.createdAt,
//         updatedAt: row.updatedAt,

//         customer: {
//           id: row.customerId,
//           name: row.customerName,
//         },

//         seller: {
//           id: row.sellerId,
//           name: row.sellerName,
//         },

//         shop: {
//           id: row.shopId,
//           name: row.shopName,
//         },

//         shipping: {
//           status: row.shippingStatus,
//           recipientName: row.recipientName,
//           recipientPhone: row.recipientPhone,
//           estimatedDelivery: row.estimatedDelivery,
//         },

//         items: [],
//       });
//     }

//     if (row.itemId) {
//       orderMap.get(row.orderId).items.push({
//         itemId: row.itemId,
//         productId: row.productId,
//         productName: row.productName,
//         productDescription: row.productDescription,
//         productImage: row.productImage,
//         quantity: row.quantity,
//         price: row.price,
//       });
//     }
//   }

//   return Array.from(orderMap.values());
// };

// //GET ALL STATIONS AND AGENTS 
// export const getStationsAndAgentsService = async () => {

//   // Stations
//   const stationList = await db
//     .select({
//       id: stations.id,
//       name: stations.name,
//       county: stations.county,
//       area: stations.area,
//       address: stations.address,
//       isStation: sql<boolean>`true`.as("isStation"),
//     })
//     .from(stations)
//     .where(eq(stations.isActive, true));

//   const agentList = await db
//     .select({
//       id: agents.id,
//       name: users.firstname, 
//       county: agents.county,
//       area: agents.area,
//       address: agents.address,
//       isStation: sql<boolean>`false`.as("isStation"),
//     })
//     .from(agents)
//     .innerJoin(users, eq(agents.userId, users.id))
//     .where(eq(agents.isActive, true));

//   return [...stationList, ...agentList];
// };

// //Get orders by station id
// export const getOrdersByStationIdService = async (stationId: number) => {
//   const sellerUser = alias(users, "sellerUser");

//   const rows = await db
//     .select({
//       // Order
//       orderId: orders.id,
//       userId: orders.userId,
//       status: orders.status,
//       totalAmount: orders.totalAmount,
//       paymentStatus: orders.paymentStatus,
//       createdAt: orders.createdAt,
//       updatedAt: orders.updatedAt,

//       // Customer
//       customerId: users.id,
//       customerName: users.firstname,

//       // Shop
//       shopId: shops.id,
//       shopName: shops.name,

//       // Seller
//       sellerId: sellers.id,
//       sellerName: sellerUser.firstname,

//       // Item
//       itemId: orderItems.id,
//       quantity: orderItems.quantity,
//       price: orderItems.price,

//       // Product
//       productId: products.id,
//       productName: products.name,
//       productDescription: products.description,
//       productImage: productImages.imageUrl,

//       // Shipping
//       shippingStatus: shipping.status,
//       recipientName: shipping.recipientName,
//       recipientPhone: shipping.recipientPhone,
//       estimatedDelivery: shipping.estimatedDelivery,
//     })
//     .from(shipping)
//     .innerJoin(orders, eq(shipping.orderId, orders.id))
//     .leftJoin(users, eq(orders.userId, users.id))
//     .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
//     .leftJoin(products, eq(orderItems.productId, products.id))
//      .leftJoin(
//       productImages,
//       and(
//         eq(productImages.productId, products.id),
//         eq(productImages.isMain, true)
//       )
//     )
//     .leftJoin(shops, eq(orderItems.shopId, shops.id))
//     .leftJoin(sellers, eq(shops.sellerId, sellers.id))
//     .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
//     .where(eq(shipping.pickupStationId, stationId));

//   if (!rows.length) return [];

//   const orderMap = new Map<number, any>();

//   for (const row of rows) {
//     if (!orderMap.has(row.orderId)) {
//       orderMap.set(row.orderId, {
//         orderId: row.orderId,
//         userId: row.userId,
//         status: row.status,
//         totalAmount: row.totalAmount,
//         paymentStatus: row.paymentStatus,
//         createdAt: row.createdAt,
//         updatedAt: row.updatedAt,

//         customer: {
//           id: row.customerId,
//           name: row.customerName,
//         },

//         seller: {
//           id: row.sellerId,
//           name: row.sellerName,
//         },

//         shop: {
//           id: row.shopId,
//           name: row.shopName,
//         },
//         shipping: {
//           status: row.shippingStatus,
//           recipientName: row.recipientName,
//           recipientPhone: row.recipientPhone,
//           estimatedDelivery: row.estimatedDelivery,
//         },

//         items: [],
//       });
//     }

//     // Push items
//     if (row.itemId) {
//       orderMap.get(row.orderId).items.push({
//         itemId: row.itemId,
//         productId: row.productId,
//         productName: row.productName,
//         productDescription: row.productDescription,
//         productImage: row.productImage,
//         quantity: row.quantity,
//         price: row.price,
//       });
//     }
//   }

//   return Array.from(orderMap.values());
// };

// //Get orders by origin station id
// export const getOrdersByOriginStationIdService = async (stationId: number) => {
//   const sellerUser = alias(users, "sellerUser");

//   const rows = await db
//     .select({
//       // Order
//       orderId: orders.id,
//       userId: orders.userId,
//       status: orders.status,
//       totalAmount: orders.totalAmount,
//       paymentStatus: orders.paymentStatus,
//       createdAt: orders.createdAt,
//       updatedAt: orders.updatedAt,

//       // Customer
//       customerId: users.id,
//       customerName: users.firstname,

//       // Shop
//       shopId: shops.id,
//       shopName: shops.name,

//       // Seller
//       sellerId: sellers.id,
//       sellerName: sellerUser.firstname,

//       // Item
//       itemId: orderItems.id,
//       quantity: orderItems.quantity,
//       price: orderItems.price,

//       // Product
//       productId: products.id,
//       productName: products.name,
//       productDescription: products.description,
//       productImage: productImages.imageUrl, 

//       // Shipping
//       shippingStatus: shipping.status,
//       recipientName: shipping.recipientName,
//       recipientPhone: shipping.recipientPhone,
//       estimatedDelivery: shipping.estimatedDelivery,
//     })
//     .from(orders)
//     .leftJoin(users, eq(orders.userId, users.id))
//     .leftJoin(shipping, eq(orders.id, shipping.orderId))
//     .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
//     .leftJoin(products, eq(orderItems.productId, products.id))
//     .leftJoin(
//       productImages,
//       and(
//         eq(productImages.productId, products.id),
//         eq(productImages.isMain, true)
//       )
//     )

//     .leftJoin(shops, eq(orderItems.shopId, shops.id))
//     .leftJoin(sellers, eq(shops.sellerId, sellers.id))
//     .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
//     .where(eq(orders.originStationId, stationId));

//   if (!rows.length) return [];

//   const orderMap = new Map<number, any>();

//   for (const row of rows) {
//     if (!orderMap.has(row.orderId)) {
//       orderMap.set(row.orderId, {
//         orderId: row.orderId,
//         userId: row.userId,
//         status: row.status,
//         totalAmount: row.totalAmount,
//         paymentStatus: row.paymentStatus,
//         createdAt: row.createdAt,
//         updatedAt: row.updatedAt,

//         customer: {
//           id: row.customerId,
//           name: row.customerName,
//         },

//         seller: {
//           id: row.sellerId,
//           name: row.sellerName,
//         },

//         shop: {
//           id: row.shopId,
//           name: row.shopName,
//         },

//         shipping: {
//           status: row.shippingStatus,
//           recipientName: row.recipientName,
//           recipientPhone: row.recipientPhone,
//           estimatedDelivery: row.estimatedDelivery,
//         },

//         items: [],
//       });
//     }

//     if (row.itemId) {
//       orderMap.get(row.orderId).items.push({
//         itemId: row.itemId,
//         productId: row.productId,
//         productName: row.productName,
//         productDescription: row.productDescription,
//         productImage: row.productImage, 
//         quantity: row.quantity,
//         price: row.price,
//       });
//     }
//   }

//   return Array.from(orderMap.values());
// };



import db from "../Drizzle/db";
import { eq, and, inArray } from "drizzle-orm";
import { orders, orderItems, products, payments, shops, shipping, stations, agents, users, sellers, productImages, returns, TSShipping } from "../Drizzle/schema";
import { sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendEmail } from "../mailer/mailer";
import crypto from "crypto";

// Helper: Calculate total order amount
const calculateTotalAmount = async (orderId: number) => {
  const items = await db
    .select({ price: orderItems.price, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  await db.update(orders).set({ totalAmount: String(total) }).where(eq(orders.id, orderId));
  return total;
};

// Create or update unpaid order
export const createOrUpdateOrderService = async (
  userId: number,
  items: { productId: number; quantity: number }[],
  pickupStationId?: number | null,
  pickupAgentId?: number | null
) => {
  let existingOrder = await db.query.orders.findFirst({
    where: and(eq(orders.userId, userId), eq(orders.paymentStatus, "unpaid")),
  });

  if (!existingOrder) {
    const insertResult = await db
      .insert(orders)
      .values({
        userId,
        paymentStatus: "unpaid",
        status: "pending",
        totalAmount: "0",
        pickupStationId: pickupStationId ?? null,
        pickupAgentId: pickupAgentId ?? null,
        originStationId: null,
      })
      .returning();

    const newOrder = Array.isArray(insertResult) ? insertResult[0] : undefined;
    if (!newOrder) throw new Error("Failed to create new order");
    existingOrder = newOrder;
  } else {
    await db
      .update(orders)
      .set({
        pickupStationId: pickupStationId ?? existingOrder.pickupStationId,
        pickupAgentId: pickupAgentId ?? existingOrder.pickupAgentId,
      })
      .where(eq(orders.id, existingOrder.id));
  }

  for (const { productId, quantity } of items) {
    const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
    if (!product) throw new Error(`Product with ID ${productId} not found`);

    if (!existingOrder) {
      throw new Error("Order could not be created or found");
    }

    const existingItem = await db.query.orderItems.findFirst({
      where: and(eq(orderItems.orderId, existingOrder.id), eq(orderItems.productId, productId)),
    });

    if (existingItem) {
      await db
        .update(orderItems)
        .set({ quantity: existingItem.quantity + quantity, price: product.price })
        .where(eq(orderItems.id, existingItem.id));
    } else {
      await db.insert(orderItems).values({
        orderId: existingOrder.id,
        productId,
        shopId: product.shopId,
        quantity,
        price: product.price,
      });
    }
  }

  if (!existingOrder) {
    throw new Error("Order could not be created or found");
  }
  const totalAmount = await calculateTotalAmount(existingOrder.id);

  return {
    message: "Order updated successfully",
    orderId: existingOrder.id,
    totalAmount,
    pickupStationId: existingOrder.pickupStationId ?? pickupStationId ?? null,
    pickupAgentId: existingOrder.pickupAgentId ?? pickupAgentId ?? null,
  };
};

// Get all orders
// export const getAllOrdersService = async () =>
//   db.query.orders.findMany({
//     with: { user: true, items: { with: { product: true } }, payments: true, shipping: true },
//   });


export const getAllOrdersService = async () => {
  const ordersList = await db.query.orders.findMany({
    with: { 
      user: true, 
      items: { with: { product: true } }, 
      payments: true, 
      shipping: true 
    },
  });

  for (const order of ordersList) {
    // Fetch main product images for original items
    const productIds = order.items.map((i: any) => i.productId);
    const mainImages = await db
      .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(and(inArray(productImages.productId, productIds), eq(productImages.isMain, true)));

    // Map main image to each product
    order.items = order.items.map((item: any) => {
      const mainImageRecord = mainImages.find((img) => img.productId === item.productId);
      return { ...item, product: { ...item.product, productImage: mainImageRecord?.imageUrl || null } };
    });

    // Fetch returns for this order's items
    const returnRecords = await db
      .select({
        returnId: returns.id,
        orderItemId: returns.orderItemId,
        replacementItemId: returns.replacementShipmentId,
        reason: returns.reason,
        status: returns.status,
      })
      .from(returns)
      .where(inArray(returns.orderItemId, order.items.map((i: any) => i.id)));

    // Fetch replacement items if any
    const replacementItems = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        shopId: orderItems.shopId,
        replacementForReturnId: orderItems.replacementForReturnId,
      })
      .from(orderItems)
      .where(
        inArray(orderItems.replacementForReturnId, returnRecords.map((r) => r.returnId).filter(Boolean))
      );

    // Fetch main product images for replacement items
    const replacementProductIds = replacementItems.map((ri) => ri.productId);
    const replacementImages = await db
      .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(and(inArray(productImages.productId, replacementProductIds), eq(productImages.isMain, true)));

    // Attach returns and replacements (with main images) to each item
    order.items = order.items.map((item: any) => {
      const itemReturns = returnRecords.filter((r) => r.orderItemId === item.id);
      const replacements = itemReturns
        .map((r) =>
          replacementItems
            .filter((ri) => ri.replacementForReturnId === r.returnId)
            .map((ri) => ({
              ...ri,
              product: {
                productId: ri.productId,
                productImage: replacementImages.find(img => img.productId === ri.productId)?.imageUrl || null,
              },
            }))
        )
        .flat();
      return { ...item, returns: itemReturns, replacements };
    });
  }

  return ordersList;
};

// Get order by ID
// export const getOrderByIdService = async (orderId: number) => {
//   const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//     with: { items: { with: { product: true } }, payments: true, shipping: true },
//   });
//   if (!order) throw new Error("Order not found");
//   return order;
// };
export const getOrderByIdService = async (orderId: number) => {
  // Fetch the original order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: { with: { product: true } },
      payments: true,
      shipping: true,
    },
  });

  if (!order) throw new Error("Order not found");

  // Collect product IDs for original items
  const productIds = order.items.map((i: any) => i.productId);

  // Fetch main product images for all original items
  const mainImages = await db
    .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(and(inArray(productImages.productId, productIds), eq(productImages.isMain, true)));

  // Attach main image to each original product
  order.items = order.items.map((item: any) => {
    const mainImageRecord = mainImages.find((img) => img.productId === item.productId);
    return { ...item, product: { ...item.product, productImage: mainImageRecord?.imageUrl || null } };
  });

  // Fetch returns for the order's items
  const returnRecords = await db
    .select({
      returnId: returns.id,
      orderItemId: returns.orderItemId,
      replacementItemId: returns.replacementShipmentId,
      reason: returns.reason,
      status: returns.status,
    })
    .from(returns)
    .where(inArray(returns.orderItemId, order.items.map((i: any) => i.id)));

  // Fetch replacement items if any
  const replacementItems = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      shopId: orderItems.shopId,
      replacementForReturnId: orderItems.replacementForReturnId,
    })
    .from(orderItems)
    .where(
      inArray(orderItems.replacementForReturnId, returnRecords.map((r) => r.returnId).filter(Boolean))
    );

  // Fetch main images for replacement items
  const replacementProductIds = replacementItems.map((ri) => ri.productId);
  const replacementImages = await db
    .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(and(inArray(productImages.productId, replacementProductIds), eq(productImages.isMain, true)));

  // Attach returns and replacements with main images to the order items
  const isAssignedToOrigin = !!order.originStationId;

  const itemsWithReplacements = order.items.map((item: any) => {
    const itemReturns = returnRecords.filter((r) => r.orderItemId === item.id);
    const replacements = itemReturns
      .map((r) =>
        replacementItems
          .filter((ri) => ri.replacementForReturnId === r.returnId)
          .map((ri) => ({
            ...ri,
            isAssignedToOrigin: isAssignedToOrigin,
            product: {
              productId: ri.productId,
              productImage: replacementImages.find(img => img.productId === ri.productId)?.imageUrl || null,
            },
          }))
      )
      .flat();

    return { ...item, isAssignedToOrigin: isAssignedToOrigin, returns: itemReturns, replacements };
  });

  return { ...order, items: itemsWithReplacements };
};

// Cancel unpaid order
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
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new Error("Order not found");

  const [payment] = await db
    .insert(payments)
    .values({ orderId: order.id, method: "mpesa", amount: order.totalAmount, status: "paid", transactionRef })
    .returning();

  await db.update(orders).set({ paymentStatus: "paid", status: "paid", updatedAt: new Date() }).where(eq(orders.id, order.id));
  return { message: "Order marked as paid", payment };
};

// Get orders by user ID
// export const getOrdersByUserIdService = async (userId: number) => {
//   const userOrders = await db.query.orders.findMany({
//     where: eq(orders.userId, userId),
//     with: { items: { with: { product: true } }, payments: true, shipping: true },
//   });
//   if (!userOrders || userOrders.length === 0) throw new Error("No orders found for this user");
//   return userOrders;
// };


export const getOrdersByUserIdService = async (userId: number) => {
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      items: { with: { product: true } },
      payments: true,
      shipping: true,
    },
  });

  if (!userOrders.length) throw new Error("No orders found for this user");

  for (const order of userOrders) {
    const itemIds = order.items.map(i => i.id);

    // Fetch returns for this order's items
    const returnRecords = await db
      .select()
      .from(returns)
      .where(inArray(returns.orderItemId, itemIds));

    // Fetch replacement items
    const replacementItems = await db
      .select()
      .from(orderItems)
      .where(
        inArray(
          orderItems.replacementForReturnId,
          returnRecords.map(r => r.id)
        )
      );

    // Fetch main product images for all items 
    const allProductIds = [
      ...order.items.map(i => i.productId),
      ...replacementItems.map(r => r.productId)
    ];
    const mainImages = await db
      .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(and(inArray(productImages.productId, allProductIds), eq(productImages.isMain, true)));

    // Attach returns, replacements, and main product images
    order.items = order.items.map(item => {
      const itemReturns = returnRecords.filter(r => r.orderItemId === item.id);

      const replacements = itemReturns
        .map(ret =>
          replacementItems
            .filter(ri => ri.replacementForReturnId === ret.id)
            .map(ri => ({
              ...ri,
              product: { mainImage: mainImages.find(img => img.productId === ri.productId)?.imageUrl || null }
            }))
        )
        .flat();

      const mainImageRecord = mainImages.find(img => img.productId === item.productId);

      return {
        ...item,
        product: { ...item.product, productImage: mainImageRecord?.imageUrl || null },
        returns: itemReturns,
        replacements,
      };
    });
  }

  return userOrders;
};

// Get orders by seller ID
// export const getOrdersBySellerIdService = async (sellerId: number) => {
//   const sellerShops = await db.select({ id: shops.id }).from(shops).where(eq(shops.sellerId, sellerId));
//   if (!sellerShops.length) return [];

//   const shopIds = sellerShops.map((s) => s.id);
//   const sellerOrderItems = await db.select({
//     orderId: orderItems.orderId,
//     orderItemId: orderItems.id,
//     productId: orderItems.productId,
//     shopId: orderItems.shopId,
//     quantity: orderItems.quantity,
//     price: orderItems.price,
//   })
//     .from(orderItems)
//     .where(inArray(orderItems.shopId, shopIds));

//   if (!sellerOrderItems.length) return [];

//   const orderIds = [...new Set(sellerOrderItems.map((i) => i.orderId))];

//   const sellerOrders = await db.select({
//     id: orders.id,
//     userId: orders.userId,
//     status: orders.status,
//     totalAmount: orders.totalAmount,
//     paymentStatus: orders.paymentStatus,
//     createdAt: orders.createdAt,
//     updatedAt: orders.updatedAt,
//   })
//     .from(orders)
//     .where(inArray(orders.id, orderIds));

//   const shippingDetails = await db.select({
//     id: shipping.id,
//     orderId: shipping.orderId,
//     status: shipping.status,
//     originStationId: shipping.originStationId,
//     pickupStationId: shipping.pickupStationId,
//     pickupAgentId: shipping.pickupAgentId,
//     recipientName: shipping.recipientName,
//     recipientPhone: shipping.recipientPhone,
//     estimatedDelivery: shipping.estimatedDelivery,
//   })
//     .from(shipping)
//     .where(inArray(shipping.orderId, orderIds));

//   return sellerOrders.map((order) => {
//     const shippingRecord = shippingDetails.find((s) => s.orderId === order.id);
//     return {
//       ...order,
//       items: sellerOrderItems.filter((i) => i.orderId === order.id),
//       shipping: shippingRecord || (order.status === "shipped" ? { orderId: order.id, status: "dispatched" } : null),
//     };
//   });
// };



export const getOrdersBySellerIdService = async (sellerId: number) => {
  const sellerShops = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.sellerId, sellerId));

  if (!sellerShops.length) return [];

  const shopIds = sellerShops.map((s) => s.id);

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

  if (!sellerOrderItems.length) return [];

  const orderIds = [...new Set(sellerOrderItems.map((i) => i.orderId))];
  const itemIds = sellerOrderItems.map((i) => i.orderItemId);

  const sellerOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(inArray(orders.id, orderIds));

  const shippingDetails = await db
    .select({
      id: shipping.id,
      orderId: shipping.orderId,
      status: shipping.status,
      originStationId: shipping.originStationId,
      pickupStationId: shipping.pickupStationId,
      pickupAgentId: shipping.pickupAgentId,
      recipientName: shipping.recipientName,
      recipientPhone: shipping.recipientPhone,
      estimatedDelivery: shipping.estimatedDelivery,
    })
    .from(shipping)
    .where(inArray(shipping.orderId, orderIds));

  // Fetch returns and replacement items
  const returnRecords = await db
    .select()
    .from(returns)
    .where(inArray(returns.orderItemId, itemIds));

  const replacementItems = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.replacementForReturnId,
        returnRecords.map((r) => r.id)
      )
    );

  // Fetch main product images for all items (original + replacements)
  const allProductIds = [
    ...sellerOrderItems.map(i => i.productId),
    ...replacementItems.map(r => r.productId),
  ];
  const mainImages = await db
    .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(and(inArray(productImages.productId, allProductIds), eq(productImages.isMain, true)));

  // Attach returns, replacements, and main images
  const itemsWithReturns = sellerOrderItems.map((item) => {
    const itemReturns = returnRecords.filter(r => r.orderItemId === item.orderItemId);

    const replacements = itemReturns
      .map(ret =>
        replacementItems
          .filter(ri => ri.replacementForReturnId === ret.id)
          .map(ri => ({
            ...ri,
            product: { ...ri.product, mainImage: mainImages.find(img => img.productId === ri.productId)?.imageUrl || null }
          }))
      )
      .flat();

    const mainImageRecord = mainImages.find(img => img.productId === item.productId);

    return {
      ...item,
      productImage: mainImageRecord?.imageUrl || null,
      returns: itemReturns,
      replacements,
    };
  });

  return sellerOrders.map((order) => {
    const shippingRecord = shippingDetails.find(s => s.orderId === order.id);
    return {
      ...order,
      items: itemsWithReturns.filter(i => i.orderId === order.id),
      shipping: shippingRecord || (order.status === "shipped" ? { orderId: order.id, status: "dispatched" } : null),
    };
  });
};

// Helper: Get correct order for shipping actions (handles returns/exchanges)
// const getOrderForShipping = async (orderItemId: number) => {
//   const returnRecord = await db.query.returns.findFirst({ where: eq(returns.orderItemId, orderItemId) });

//   if (returnRecord && returnRecord.replacementShipmentId) {
//     const replacementItem = await db.query.orderItems.findFirst({ where: eq(orderItems.replacementForReturnId, returnRecord.id) });
//     if (!replacementItem) throw new Error("Replacement item not found");
//     return await db.query.orders.findFirst({ where: eq(orders.id, replacementItem.orderId), with: { shipping: true } });
//   }

//   const originalItem = await db.query.orderItems.findFirst({ where: eq(orderItems.id, orderItemId) });
//   if (!originalItem) throw new Error("Original order item not found");
//   return await db.query.orders.findFirst({ where: eq(orders.id, originalItem.orderId), with: { shipping: true } });
// };

type ShippingRecord = TSShipping;

type OrderWithRelations = {
  id: number;
  items: any[];
  shipping: ShippingRecord[];
  user: any;
  status: string;
  originStationId?: number | null;
  paymentStatus?: string;
};
export const getOrderForShipping = async (
  orderItemId: number
): Promise<OrderWithRelations> => {
  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.orderItemId, orderItemId),
  });

  let orderId: number | null = null;

  if (returnRecord && returnRecord.replacementShipmentId) {
    const replacementItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.replacementForReturnId, returnRecord.id),
    });
    if (!replacementItem) throw new Error("Replacement item not found");
    orderId = replacementItem.orderId;
  } else {
    const originalItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, orderItemId),
    });
    if (!originalItem) throw new Error("Original order item not found");
    orderId = originalItem.orderId;
  }

  if (!orderId) throw new Error("Order ID not resolved");

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) throw new Error("Order not found");

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  });

  const shippingRecords = await db.query.shipping.findMany({
    where: eq(shipping.orderId, orderId),
  });

  const user = await db.query.users.findFirst({
    where: eq(users.id, order.userId),
  });

  // Return directly using TSShipping, no null coercion
  return {
    id: order.id,
    status: order.status,
    originStationId: order.originStationId ?? null,
    paymentStatus: order.paymentStatus ?? undefined,
    items,
    shipping: shippingRecords, 
    user,
  };
};

// Assign origin station (handles returns/exchanges)
export const assignOriginStationServiceEx = async (
  orderItemId: number,
  stationId: number
) => {
  const item = await db.query.orderItems.findFirst({
    where: eq(orderItems.id, orderItemId),
    with: {
      order: true,
    },
  });

  if (!item) throw new Error("Order item not found");

  //Validate payment at order level
  if (item.order.paymentStatus !== "paid") {
    throw new Error("Only paid orders can be assigned an origin station");
  }

  //Prevent double assignment 
  if (item.originStationId) {
    throw new Error("Item already assigned to a station");
  }

  await db
    .update(orderItems)
    .set({
      originStationId: stationId,
    })
    .where(eq(orderItems.id, orderItemId));

  return {
    message: "Origin station assigned successfully",
    orderId: item.orderId,
    // orderItemId,
    stationId,
  };
};                                                                                                                                         

// Mark order as shipped
// export const markOrderAsShippedServiceEx = async (orderItemId: number) => {
//   const order = await getOrderForShipping(orderItemId);
//   if (!order) throw new Error("Order not found");
//   if (order.status !== "at_station") throw new Error("Order must be assigned to a station to be marked as shipped");

//   await db.update(orders).set({ status: "shipped", updatedAt: new Date() }).where(eq(orders.id, order.id));

//   const shippingRecord = order.shipping[0];
//   if (shippingRecord) {
//     await db.update(shipping).set({ status: "in_transit" }).where(eq(shipping.id, shippingRecord.id));
//   } else {
//     await db.insert(shipping).values({ orderId: order.id, status: "in_transit", originStationId: order.originStationId || 0 });
//   }

//   return { message: "Order marked as shipped", orderId: order.id };
export const markOrderAsShippedServiceEx = async (orderItemId: number) => {
  const order = await getOrderForShipping(orderItemId);
  if (!order) throw new Error("Order not found");

  if (!order.items || order.items.length === 0) {
    throw new Error("Order has no items");
  }

  const existingShipping = await db.query.shipping.findMany({
    where: eq(shipping.orderId, order.id),
  });

  const itemShipping = existingShipping.find(
    (s) => s.orderItemId === orderItemId
  );

  const item = await db.query.orderItems.findFirst({
    where: eq(orderItems.id, orderItemId),
  });
  if (!item?.originStationId) throw new Error("Item must be assigned to a station before shipping");

  if (itemShipping) {
    await db
      .update(shipping)
      .set({ status: "in_transit" })
      .where(eq(shipping.id, itemShipping.id));
  } else {
    await db.insert(shipping).values({
      orderId: order.id,
      orderItemId,
      status: "in_transit",
      originStationId: item.originStationId,
    });
  }

  const allShippingRecords = await db.query.shipping.findMany({
    where: eq(shipping.orderId, order.id),
  });

  const shippedItemIds = new Set(
    allShippingRecords
      .filter((s) => s.status === "in_transit" || s.status === "delivered")
      .map((s) => s.orderItemId)
      .filter((id): id is number => !!id)
  );

  const shippedCount = shippedItemIds.size;
  const totalItems = order.items.length;

  let newOrderStatus: typeof order.status;
  if (shippedCount === 0) newOrderStatus = "at_station";
  else if (shippedCount < totalItems) newOrderStatus = "processing";
  else newOrderStatus = "shipped";

  await db
    .update(orders)
    .set({ status: newOrderStatus, updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  return {
    message: `Item shipped. Order now ${newOrderStatus}`,
    orderId: order.id,
    orderItemId,
  };
};

// Mark order ready for pickup
// export const markOrderAsReadyForPickupServiceEx = async (orderItemId: number) => {
//   const order = await getOrderForShipping(orderItemId);
//   if (!order) throw new Error("Order not found");
//   if (order.status !== "shipped") throw new Error("Only shipped orders can be marked as ready for pickup");

//   const pickupCode = crypto.randomBytes(3).toString("hex").toUpperCase();
//   let shippingRecord = order.shipping[0];

//   if (shippingRecord) {
//     await db.update(shipping).set({ status: "ready_for_pickup", pickupCode }).where(eq(shipping.id, shippingRecord.id));
//   } else {
//     const inserted = await db.insert(shipping).values({ orderId: order.id, status: "ready_for_pickup", originStationId: order.originStationId || 0, pickupCode }).returning();
//     shippingRecord = inserted[0];
//   }

//   if (order.user && !Array.isArray(order.user) && order.user.email) {
//     await sendEmail(
//       order.user.email,
//       "Your Order is Ready for Pickup",
//       `Hi ${order.user.firstname}, your order #${order.id} is ready for pickup. Pickup code: ${pickupCode}`,
//       `<p>Hi ${order.user.firstname},</p><p>Your order <strong>#${order.id}</strong> is ready for pickup.</p><p><strong>Pickup Code:</strong> ${pickupCode}</p><p>Please present this code at the pickup station.</p>`
//     );
//   }

//   return { message: "Order marked as ready for pickup and code sent to customer", orderId: order.id, pickupCode };
// };


export const markOrderAsReadyForPickupService = async (orderId: number) => {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      shipping: true,
      items: true,
      user: true
    }
  });

  if (!order) throw new Error("Order not found");

  // Ensure all items have at least one shipping record marked in_transit 
  const allShippingRecords = await db.query.shipping.findMany({
    where: eq(shipping.orderId, order.id)
  });

  const shippedCount = allShippingRecords.filter(
    (s) => s.status === "in_transit" 
  ).length;

  if (shippedCount < order.items.length) {
    throw new Error("Cannot mark ready for pickup: not all items have been shipped");
  }

  const pickupCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  let shippingRecord = order.shipping?.[0];

  if (shippingRecord) {
    await db.update(shipping)
      .set({ status: "ready_for_pickup", pickupCode })
      .where(eq(shipping.id, shippingRecord.id));
  } else {
    const inserted = await db.insert(shipping)
      .values({
        orderId: order.id,
        status: "ready_for_pickup",
        originStationId: order.originStationId || 0,
        pickupCode
      })
      .returning();

    shippingRecord = inserted[0];
  }

  if (order.user?.email) {
    await sendEmail(
      order.user.email,
      "Your Order is Ready for Pickup",
      `Hi ${order.user.firstname}, your order #${order.id} is ready for pickup. Pickup code: ${pickupCode}`,
      `<p>Hi ${order.user.firstname},</p>
       <p>Your order <strong>#${order.id}</strong> is ready for pickup.</p>
       <p><strong>Pickup Code:</strong> ${pickupCode}</p>
       <p>Please present this code at the pickup station.</p>`
    );
  }

  return {
    message: "Order marked as ready for pickup",
    orderId: order.id,
  };
};


// Mark order delivered
export const markOrderAsDeliveredServiceEx = async (
  orderId: number,
  providedCode: string
) => {

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      shipping: true
    }
  });

  if (!order) throw new Error("Order not found");

  //Find shipment with pickup code
  const shippingRecord = order.shipping.find(
    s => s.pickupCode === providedCode
  );

  if (!shippingRecord)
    throw new Error("Invalid pickup code");

  if (shippingRecord.status !== "ready_for_pickup")
    throw new Error("Order is not ready for pickup");

  const now = new Date();
  const returnWindowDays = 7;

  const returnWindowEnds = new Date(
    now.getTime() + returnWindowDays * 24 * 60 * 60 * 1000
  );

  //mark ALL shipments as delivered
  await db.update(shipping)
    .set({
      status: "delivered",
      deliveredAt: now
    })
    .where(eq(shipping.orderId, order.id));

  //complete order
  await db.update(orders)
    .set({
      status: "completed",
      deliveredAt: now,
      returnWindowEndsAt: returnWindowEnds,
      escrowReleaseAt: returnWindowEnds,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

  return {
    message: "Order successfully delivered",
    orderId: order.id
  };
};

//Get order for pickup verification
export const getOrderForPickupVerificationService = async (orderId: number) => {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: true,
      items: {
        with: {
          product: {
            with: {
              images: {
                where: eq(productImages.isMain, true),
              },
            },
          },
        },
      },
      shipping: true,
    },
  });

  if (!order) throw new Error("Order not found");

  // if (order.status !== "shipped")
  //   throw new Error("Order is not ready for pickup preparation");

  return order;
};


// // Assign origin station
// export const assignOriginStationService = async (orderId: number, stationId: number) => {
//   const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
//   if (!order) throw new Error("Order not found");
//   if (order.status !== "paid") throw new Error("Only paid orders can be assigned an origin station");

//   await db.update(orders)
//     .set({ originStationId: stationId, status: "at_station", updatedAt: new Date() })
//     .where(eq(orders.id, orderId));

//   return { message: "Origin station assigned successfully", orderId, stationId };
// };

// // Mark order as shipped
// export const markOrderAsShippedService = async (orderId: number) => {
//   const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
//   if (!order) throw new Error("Order not found");
//   if (order.status !== "at_station") throw new Error("Order must be assigned to a station to be marked as shipped");

//   await db.update(orders).set({ status: "shipped", updatedAt: new Date() }).where(eq(orders.id, orderId));

//   const shippingRecord = await db.query.shipping.findFirst({ where: eq(shipping.orderId, orderId) });
//   if (shippingRecord) {
//     await db.update(shipping).set({ status: "in_transit" }).where(eq(shipping.id, shippingRecord.id));
//   } else {
//     await db.insert(shipping).values({ orderId, status: "in_transit", originStationId: order.originStationId || 0 });
//   }

//   return { message: "Order marked as shipped", orderId };
// };

// // Mark order ready for pickup
// export const markOrderAsReadyForPickupService = async (orderId: number) => {
//   const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { user: true } });
//   if (!order) throw new Error("Order not found");
//   if (order.status !== "shipped") throw new Error("Only shipped orders can be marked as ready for pickup");

//   const pickupCode = crypto.randomBytes(3).toString("hex").toUpperCase();
//   let shippingRecord = await db.query.shipping.findFirst({ where: eq(shipping.orderId, orderId) });

//   if (shippingRecord) {
//     await db.update(shipping).set({ status: "ready_for_pickup", pickupCode }).where(eq(shipping.id, shippingRecord.id));
//   } else {
//     const inserted = await db.insert(shipping).values({ orderId, status: "ready_for_pickup", originStationId: order.originStationId || 0, pickupCode }).returning();
//     shippingRecord = inserted[0];
//   }

//   if (order.user && !Array.isArray(order.user) && order.user.email) {
//     await sendEmail(
//       order.user.email,
//       "Your Order is Ready for Pickup",
//       `Hi ${order.user.firstname}, your order #${orderId} is ready for pickup. Pickup code: ${pickupCode}`,
//       `<p>Hi ${order.user.firstname},</p><p>Your order <strong>#${orderId}</strong> is ready for pickup.</p><p><strong>Pickup Code:</strong> ${pickupCode}</p><p>Please present this code at the pickup station.</p>`
//     );
//   }

//   return { message: "Order marked as ready for pickup and code sent to customer", orderId, pickupCode };
// };

// // Mark order delivered
// export const markOrderAsDeliveredService = async (orderId: number, providedCode: string) => {
//   const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { shipping: true } });
//   if (!order) throw new Error("Order not found");

//   const shippingRecord = order.shipping[0];
//   if (!shippingRecord) throw new Error("Shipping record not found for this order");
//   if (!shippingRecord.pickupCode || shippingRecord.pickupCode !== providedCode) throw new Error("Invalid pickup code");
//   if (shippingRecord.status !== "ready_for_pickup") throw new Error("Order is not ready for pickup");

//   const now = new Date();
//   const returnWindowDays = 7;
//   const returnWindowEnds = new Date(now.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);

//   await db.update(orders).set({
//     status: "completed",
//     deliveredAt: now,
//     returnWindowEndsAt: returnWindowEnds,
//     escrowReleaseAt: returnWindowEnds,
//     updatedAt: now,
//   }).where(eq(orders.id, orderId));

//   await db.update(shipping).set({ status: "delivered", deliveredAt: now }).where(eq(shipping.id, shippingRecord.id));
//   return { message: "Order successfully delivered", orderId };
// };

// Fetch orders by agent, station, origin station and get stations/agents
const buildOrderMap = (rows: any[]) => {
  const orderMap = new Map<number, any>();
  for (const row of rows) {
    if (!orderMap.has(row.orderId)) {
      orderMap.set(row.orderId, {
        orderId: row.orderId,
        userId: row.userId,
        status: row.status,
        totalAmount: row.totalAmount,
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        customer: { id: row.customerId, name: row.customerName },
        seller: { id: row.sellerId, name: row.sellerName },
        shop: { id: row.shopId, name: row.shopName },
        shipping: { status: row.shippingStatus, recipientName: row.recipientName, recipientPhone: row.recipientPhone, estimatedDelivery: row.estimatedDelivery },
        items: [],
      });
    }
    if (row.itemId) {
      orderMap.get(row.orderId).items.push({
        itemId: row.itemId,
        productId: row.productId,
        productName: row.productName,
        productDescription: row.productDescription,
        productImage: row.productImage,
        quantity: row.quantity,
        price: row.price,
      });
    }
  }
  return Array.from(orderMap.values());
};

// export const getOrdersByAgentIdService = async (agentId: number) => {
//   const sellerUser = alias(users, "sellerUser");
//   const rows = await db.select({
//     orderId: orders.id, userId: orders.userId, status: orders.status, totalAmount: orders.totalAmount,
//     paymentStatus: orders.paymentStatus, createdAt: orders.createdAt, updatedAt: orders.updatedAt,
//     customerId: users.id, customerName: users.firstname,
//     shopId: shops.id, shopName: shops.name,
//     sellerId: sellers.id, sellerName: sellerUser.firstname,
//     itemId: orderItems.id, quantity: orderItems.quantity, price: orderItems.price,
//     productId: products.id, productName: products.name, productDescription: products.description, productImage: productImages.imageUrl,
//     shippingStatus: shipping.status, recipientName: shipping.recipientName, recipientPhone: shipping.recipientPhone, estimatedDelivery: shipping.estimatedDelivery,
//   })
//     .from(shipping)
//     .innerJoin(orders, eq(shipping.orderId, orders.id))
//     .leftJoin(users, eq(orders.userId, users.id))
//     .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
//     .leftJoin(products, eq(orderItems.productId, products.id))
//     .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isMain, true)))
//     .leftJoin(shops, eq(orderItems.shopId, shops.id))
//     .leftJoin(sellers, eq(shops.sellerId, sellers.id))
//     .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
//     .where(eq(shipping.pickupAgentId, agentId));

//   if (!rows.length) return [];
//   return buildOrderMap(rows);
// };

export const getOrdersByAgentIdService = async (agentId: number) => {
  const sellerUser = alias(users, "sellerUser");
  const replacementItems = alias(orderItems, "replacementItems");
  const replacementProductImages = alias(productImages, "replacementProductImages");

  const rows = await db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,

      customerId: users.id,
      customerName: users.firstname,

      shopId: shops.id,
      shopName: shops.name,

      sellerId: sellers.id,
      sellerName: sellerUser.firstname,

      itemId: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,

      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productImage: productImages.imageUrl,

      shippingStatus: shipping.status,
      recipientName: shipping.recipientName,
      recipientPhone: shipping.recipientPhone,
      estimatedDelivery: shipping.estimatedDelivery,

      // RETURN INFO
      returnId: returns.id,
      returnReason: returns.reason,
      returnStatus: returns.status,

      // REPLACEMENT ITEM
      replacementItemId: replacementItems.id,
      replacementProductId: replacementItems.productId,
      replacementQuantity: replacementItems.quantity,
      replacementProductImage: replacementProductImages.imageUrl,
    })
    .from(shipping)
    .innerJoin(orders, eq(shipping.orderId, orders.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isMain, true)))
    .leftJoin(shops, eq(orderItems.shopId, shops.id))
    .leftJoin(sellers, eq(shops.sellerId, sellers.id))
    .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))

    // JOIN RETURNS
    .leftJoin(returns, eq(returns.orderItemId, orderItems.id))

    // JOIN REPLACEMENT ITEMS
    .leftJoin(replacementItems as any, eq(replacementItems.replacementForReturnId, returns.id))

    // JOIN MAIN IMAGE FOR REPLACEMENT ITEMS
    .leftJoin(
      replacementProductImages as any,
      and(
        eq(replacementProductImages.productId, replacementItems.productId),
        eq(replacementProductImages.isMain, true)
      )
    )

    .where(eq(shipping.pickupAgentId, agentId));

  if (!rows.length) return [];

  // Build nested structure
  const ordersMap: Record<number, any> = {};

  for (const row of rows) {
    if (!ordersMap[row.orderId]) {
      ordersMap[row.orderId] = {
        id: row.orderId,
        userId: row.userId,
        status: row.status,
        totalAmount: row.totalAmount,
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        customer: { id: row.customerId, name: row.customerName },
        items: [],
        shipping: {
          status: row.shippingStatus,
          recipientName: row.recipientName,
          recipientPhone: row.recipientPhone,
          estimatedDelivery: row.estimatedDelivery,
        },
      };
    }

    const order = ordersMap[row.orderId];

    // Add order item if not exists
    let item = order.items.find((i: any) => i.id === row.itemId);
    if (!item) {
      item = {
        id: row.itemId,
        quantity: row.quantity,
        price: row.price,
        product: {
          id: row.productId,
          name: row.productName,
          description: row.productDescription,
          productImage: row.productImage,
        },
        returns: [],
      };
      order.items.push(item);
    }

    // Add return if exists
    if (row.returnId) {
      let ret = item.returns.find((r: any) => r.returnId === row.returnId);
      if (!ret) {
        ret = {
          returnId: row.returnId,
          reason: row.returnReason,
          status: row.returnStatus,
          replacements: [],
        };
        item.returns.push(ret);
      }

      // Add replacement if exists
      if (row.replacementItemId) {
        ret.replacements.push({
          id: row.replacementItemId,
          productId: row.replacementProductId,
          quantity: row.replacementQuantity,
          productImage: row.replacementProductImage,
        });
      }
    }
  }

  return Object.values(ordersMap);
};


export const getStationsAndAgentsService = async () => {
  const stationList = await db.select({ id: stations.id, name: stations.name, county: stations.county, area: stations.area, address: stations.address, isStation: sql<boolean>`true`.as("isStation") }).from(stations).where(eq(stations.isActive, true));
  const agentList = await db.select({ id: agents.id, name: users.firstname, county: agents.county, area: agents.area, address: agents.address, isStation: sql<boolean>`false`.as("isStation") }).from(agents).innerJoin(users, eq(agents.userId, users.id)).where(eq(agents.isActive, true));
  return [...stationList, ...agentList];
};

// export const getOrdersByStationIdService = async (stationId: number) => {
//   const sellerUser = alias(users, "sellerUser");
//   const rows = await db.select({ orderId: orders.id, userId: orders.userId, status: orders.status, totalAmount: orders.totalAmount, paymentStatus: orders.paymentStatus, createdAt: orders.createdAt, updatedAt: orders.updatedAt, customerId: users.id, customerName: users.firstname, shopId: shops.id, shopName: shops.name, sellerId: sellers.id, sellerName: sellerUser.firstname, itemId: orderItems.id, quantity: orderItems.quantity, price: orderItems.price, productId: products.id, productName: products.name, productDescription: products.description, productImage: productImages.imageUrl, shippingStatus: shipping.status, recipientName: shipping.recipientName, recipientPhone: shipping.recipientPhone, estimatedDelivery: shipping.estimatedDelivery })
//     .from(shipping)
//     .innerJoin(orders, eq(shipping.orderId, orders.id))
//     .leftJoin(users, eq(orders.userId, users.id))
//     .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
//     .leftJoin(products, eq(orderItems.productId, products.id))
//     .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isMain, true)))
//     .leftJoin(shops, eq(orderItems.shopId, shops.id))
//     .leftJoin(sellers, eq(shops.sellerId, sellers.id))
//     .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
//     .where(eq(shipping.pickupStationId, stationId));
//   if (!rows.length) return [];
//   return buildOrderMap(rows);
// };

export const getOrdersByStationIdService = async (stationId: number) => {
  const sellerUser = alias(users, "sellerUser");
  const replacementItems = alias(orderItems, "replacementItems");
  const replacementProductImages = alias(productImages, "replacementProductImages");

  // Fetch flat rows
  const rows = await db.select({
    orderId: orders.id,
    userId: orders.userId,
    status: orders.status,
    totalAmount: orders.totalAmount,
    paymentStatus: orders.paymentStatus,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,

    customerId: users.id,
    customerName: users.firstname,

    shopId: shops.id,
    shopName: shops.name,

    sellerId: sellers.id,
    sellerName: sellerUser.firstname,

    itemId: orderItems.id,
    quantity: orderItems.quantity,
    price: orderItems.price,

    productId: products.id,
    productName: products.name,
    productDescription: products.description,
    productImage: productImages.imageUrl,

    shippingStatus: shipping.status,
    recipientName: shipping.recipientName,
    recipientPhone: shipping.recipientPhone,
    estimatedDelivery: shipping.estimatedDelivery,

    // RETURN INFO
    returnId: returns.id,
    returnReason: returns.reason,
    returnStatus: returns.status,

    // REPLACEMENT ITEM
    replacementItemId: replacementItems.id,
    replacementProductId: replacementItems.productId,
    replacementQuantity: replacementItems.quantity,
    replacementProductImage: replacementProductImages.imageUrl,
  })
    .from(shipping)
    .innerJoin(orders, eq(shipping.orderId, orders.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isMain, true)))
    .leftJoin(shops, eq(orderItems.shopId, shops.id))
    .leftJoin(sellers, eq(shops.sellerId, sellers.id))
    .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))

    // JOIN RETURNS
    .leftJoin(returns, eq(returns.orderItemId, orderItems.id))

    // JOIN REPLACEMENT ITEMS
    .leftJoin(replacementItems as any, eq(replacementItems.replacementForReturnId, returns.id))

    // JOIN MAIN IMAGE FOR REPLACEMENT ITEMS
    .leftJoin(
      replacementProductImages as any,
      and(
        eq(replacementProductImages.productId, replacementItems.productId),
        eq(replacementProductImages.isMain, true)
      )
    )

    .where(eq(shipping.pickupStationId, stationId));

  if (!rows.length) return [];

  // Build nested structure
  const ordersMap: Record<number, any> = {};

  for (const row of rows) {
    if (!ordersMap[row.orderId]) {
      ordersMap[row.orderId] = {
        id: row.orderId,
        userId: row.userId,
        status: row.status,
        totalAmount: row.totalAmount,
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        customer: { id: row.customerId, name: row.customerName },
        items: [],
        shipping: {
          status: row.shippingStatus,
          recipientName: row.recipientName,
          recipientPhone: row.recipientPhone,
          estimatedDelivery: row.estimatedDelivery,
        },
      };
    }

    const order = ordersMap[row.orderId];

    // Add order item if not exists
    let item = order.items.find((i: any) => i.id === row.itemId);
    if (!item) {
      item = {
        id: row.itemId,
        quantity: row.quantity,
        price: row.price,
        product: {
          id: row.productId,
          name: row.productName,
          description: row.productDescription,
          productImage: row.productImage,
        },
        returns: [],
      };
      order.items.push(item);
    }

    // Add return if exists
    if (row.returnId) {
      let ret = item.returns.find((r: any) => r.returnId === row.returnId);
      if (!ret) {
        ret = {
          returnId: row.returnId,
          reason: row.returnReason,
          status: row.returnStatus,
          replacements: [],
        };
        item.returns.push(ret);
      }

      // Add replacement if exists
      if (row.replacementItemId) {
        ret.replacements.push({
          id: row.replacementItemId,
          productId: row.replacementProductId,
          quantity: row.replacementQuantity,
          productImage: row.replacementProductImage,
        });
      }
    }
  }

  return Object.values(ordersMap);
};

// export const getOrdersByOriginStationIdService = async (stationId: number) => {
//   const sellerUser = alias(users, "sellerUser");
//   const rows = await db.select({ orderId: orders.id, userId: orders.userId, status: orders.status, totalAmount: orders.totalAmount, paymentStatus: orders.paymentStatus, createdAt: orders.createdAt, updatedAt: orders.updatedAt, customerId: users.id, customerName: users.firstname, shopId: shops.id, shopName: shops.name, sellerId: sellers.id, sellerName: sellerUser.firstname, itemId: orderItems.id, quantity: orderItems.quantity, price: orderItems.price, productId: products.id, productName: products.name, productDescription: products.description, productImage: productImages.imageUrl, shippingStatus: shipping.status, recipientName: shipping.recipientName, recipientPhone: shipping.recipientPhone, estimatedDelivery: shipping.estimatedDelivery })
//     .from(orders)
//     .leftJoin(users, eq(orders.userId, users.id))
//     .leftJoin(shipping, eq(orders.id, shipping.orderId))
//     .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
//     .leftJoin(products, eq(orderItems.productId, products.id))
//     .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isMain, true)))
//     .leftJoin(shops, eq(orderItems.shopId, shops.id))
//     .leftJoin(sellers, eq(shops.sellerId, sellers.id))
//     .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
//     .where(eq(orders.originStationId, stationId));
//   if (!rows.length) return [];
//   return buildOrderMap(rows);
// };

export const getOrdersByOriginStationIdService = async (stationId: number) => {
  const ordersList = await db.query.orders.findMany({
    where: eq(orders.originStationId, stationId),
    with: {
      items: { with: { product: true } },
      shipping: true,
      user: true,
      payments: true,
    },
  });

  for (const order of ordersList) {
    const itemIds = order.items.map((i: any) => i.id);
    const productIds = order.items.map((i: any) => i.productId);

    // Main product images
    const mainImages = await db
      .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(and(inArray(productImages.productId, productIds), eq(productImages.isMain, true)));

    order.items = order.items.map((item: any) => ({
      ...item,
      product: { ...item.product, productImage: mainImages.find(img => img.productId === item.productId)?.imageUrl || null }
    }));

    // Returns for this order's items
    const returnRecords = await db
      .select({
        returnId: returns.id,
        orderItemId: returns.orderItemId,
        reason: returns.reason,
        status: returns.status,
      })
      .from(returns)
      .where(inArray(returns.orderItemId, itemIds));

    // Replacement items for returns
    const replacementItems = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        shopId: orderItems.shopId,
        replacementForReturnId: orderItems.replacementForReturnId,
      })
      .from(orderItems)
      .where(inArray(orderItems.replacementForReturnId, returnRecords.map(r => r.returnId).filter(Boolean)));

    // Main images for replacement products
    const replacementProductIds = replacementItems.map((ri: any) => ri.productId);
    const replacementImages = await db
      .select({ productId: productImages.productId, imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(and(inArray(productImages.productId, replacementProductIds), eq(productImages.isMain, true)));

    // Attach returns and replacements
    order.items = order.items.map((item: any) => {
      const itemReturns = returnRecords.filter(r => r.orderItemId === item.id);
      const returnsWithReplacements = itemReturns.map(r => ({
        ...r,
        replacements: replacementItems
          .filter(ri => ri.replacementForReturnId === r.returnId)
          .map(ri => ({
            ...ri,
            productImage: replacementImages.find(img => img.productId === ri.productId)?.imageUrl || null,
          }))
      }));

      return { ...item, returns: returnsWithReplacements };
    });
  }

  return ordersList;
};