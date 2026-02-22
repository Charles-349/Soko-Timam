import db from "../Drizzle/db"; 
import { eq, and, inArray } from "drizzle-orm";
import { orders, orderItems, products, payments, shops, shipping, stations, agents, users, sellers, productImages } from "../Drizzle/schema";
import type { TIOrder, TIOrderItem } from "../Drizzle/schema";
import { sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendEmail } from "../mailer/mailer";
import crypto from "crypto";

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
// export const createOrUpdateOrderService = async (
//   userId: number,
//   items: { productId: number; quantity: number }[],
//   shippingAddress: string
// ) => {
//   //Find existing unpaid order
//   let existingOrder = await db.query.orders.findFirst({
//     where: and(eq(orders.userId, userId), eq(orders.paymentStatus, "unpaid")),
//   });

//   //If none exists, create a new order
//   if (!existingOrder) {
//     const [newOrder] = await db
//       .insert(orders)
//       .values({
//         userId,
//         paymentStatus: "unpaid",
//         status: "pending",
//         totalAmount: "0",
//         shippingAddress,
//       })
//       .returning();

//     existingOrder = newOrder;
//   }

//   //Add or update each item in order_items
//   for (const { productId, quantity } of items) {
//     const product = await db.query.products.findFirst({
//       where: eq(products.id, productId),
//     });

//     if (!product) {
//       throw new Error(`Product with ID ${productId} not found`);
//     }

//     // Check if item already exists in this order
//     const existingItem = await db.query.orderItems.findFirst({
//       where: and(eq(orderItems.orderId, existingOrder.id), eq(orderItems.productId, productId)),
//     });

//     if (existingItem) {
//       // Update quantity
//       await db
//         .update(orderItems)
//         .set({
//           quantity: existingItem.quantity + quantity,
//           price: product.price,
//         })
//         .where(eq(orderItems.id, existingItem.id));
//     } else {
//       // Create new item
//       await db.insert(orderItems).values({
//         orderId: existingOrder.id,
//         productId,
//         shopId: product.shopId,
//         quantity,
//         price: product.price,
//       });
//     }
//   }

//   //Recalculate total
//   const totalAmount = await calculateTotalAmount(existingOrder.id);

//   return {
//     message: "Order updated successfully",
//     orderId: existingOrder.id,
//     totalAmount,
//   };
// };

export const createOrUpdateOrderService = async (
  userId: number,
  items: { productId: number; quantity: number }[],
  pickupStationId?: number | null, 
  pickupAgentId?: number |null   
) => {
  // Find existing unpaid order
  let existingOrder = await db.query.orders.findFirst({
    where: and(eq(orders.userId, userId), eq(orders.paymentStatus, "unpaid")),
  });

  // If none exists, create a new order
  if (!existingOrder) {
    const [newOrder] = await db
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

    existingOrder = newOrder;
  } else {
    // Update pickup info if customer changes selection
    await db
      .update(orders)
      .set({
        pickupStationId: pickupStationId ?? existingOrder.pickupStationId,
        pickupAgentId: pickupAgentId ?? existingOrder.pickupAgentId,

      })
      .where(eq(orders.id, existingOrder.id));
  }

  // Add or update each item in order_items
  for (const { productId, quantity } of items) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const existingItem = await db.query.orderItems.findFirst({
      where: and(
        eq(orderItems.orderId, existingOrder.id),
        eq(orderItems.productId, productId)
      ),
    });

    if (existingItem) {
      await db
        .update(orderItems)
        .set({
          quantity: existingItem.quantity + quantity,
          price: product.price,
        })
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

  // Recalculate total
  const totalAmount = await calculateTotalAmount(existingOrder.id);

  return {
    message: "Order updated successfully",
    orderId: existingOrder.id,
    totalAmount,
    pickupStationId: existingOrder.pickupStationId ?? pickupStationId ?? null,
    pickupAgentId: existingOrder.pickupAgentId ?? pickupAgentId ?? null,

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
    console.log("No shops found for this seller");
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
    console.log("No order items found for these shops");
    return [];
  }

  // Extract unique order IDs
  const orderIds = [...new Set(sellerOrderItems.map((item) => item.orderId))];

  //Fetch all orders related to those order IDs
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

  // Fetch shipping details for those orders
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

  // Combine everything: orders + items + shipping
  const combined = sellerOrders.map((order) => {
    // Ensure shipping status is updated if order.status is shipped
    const shippingRecord = shippingDetails.find((ship) => ship.orderId === order.id);

    // If order is marked as shipped but no shipping record exists, create a temporary one in response
    const shippingInfo =
      shippingRecord ||
      (order.status === "shipped"
        ? {
            orderId: order.id,
            status: "dispatched",
          }
        : null);

    return {
      ...order,
      items: sellerOrderItems.filter((item) => item.orderId === order.id),
      shipping: shippingInfo,
    };
  });

  return combined;
};

export const assignOriginStationService = async (
  orderId: number,
  stationId: number
) => {
  // Check order exists
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) throw new Error("Order not found");

  // Update origin station
  await db.update(orders)
    .set({
      originStationId: stationId,
      status: "at_station", 
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  return {
    message: "Origin station assigned successfully",
    orderId,
    stationId,
  };
};

export const markOrderAsShippedService = async (orderId: number) => {
  // Fetch the order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) throw new Error("Order not found");

  // Update order status to shipped
  await db.update(orders).set({ status: "shipped", updatedAt: new Date() }).where(eq(orders.id, orderId));

  // Update shipping record if it exists
  const shippingRecord = await db.query.shipping.findFirst({
    where: eq(shipping.orderId, orderId),
  });

  if (shippingRecord) {
    await db.update(shipping).set({ status: "in_transit" }).where(eq(shipping.id, shippingRecord.id));
  } else {
    //create a shipping record if none exists
    await db.insert(shipping).values({
      orderId,
      status: "in_transit",
      originStationId: order.originStationId || 0,
    });
  }

  return { message: "Order marked as shipped", orderId };
};

//Mark order as ready for pickup
export const markOrderAsReadyForPickupService = async (orderId: number) => {
  // Fetch the order with customer info
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { user: true },
  });

  if (!order) throw new Error("Order not found");

  // Generate a random 6-character alphanumeric pickup code
  const pickupCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  // Update shipping record if it exists
  let shippingRecord = await db.query.shipping.findFirst({
    where: eq(shipping.orderId, orderId),
  });

  if (shippingRecord) {
    await db.update(shipping)
      .set({ status: "ready_for_pickup", pickupCode })
      .where(eq(shipping.id, shippingRecord.id));
  } else {
    // Create a shipping record if none exists
    const inserted = await db.insert(shipping).values({
      orderId,
      status: "ready_for_pickup",
      originStationId: order.originStationId || 0,
      pickupCode,
    }).returning();

    shippingRecord = inserted[0];
  }

  // Send pickup code to customer's email 
  if (order.user?.email) {
    await sendEmail(
      order.user.email,
      "Your Order is Ready for Pickup",
      `Hi ${order.user.firstname}, your order #${orderId} is ready for pickup. Pickup code: ${pickupCode}`,
      `
        <p>Hi ${order.user.firstname},</p>
        <p>Your order <strong>#${orderId}</strong> is ready for pickup.</p>
        <p><strong>Pickup Code:</strong> ${pickupCode}</p>
        <p>Please present this code at the pickup station.</p>
      `
    );
  }

  return {
    message: "Order marked as ready for pickup and code sent to customer",
    orderId,
    pickupCode,
  };
};

//Mark order as delivered
export const markOrderAsDeliveredService = async (orderId: number, providedCode: string) => {
  // Fetch the order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { shipping: true }, // fetch shipping record too
  });

  if (!order) throw new Error("Order not found");

  const shippingRecord = order.shipping[0]; // assuming one shipping record per order

  if (!shippingRecord) throw new Error("Shipping record not found for this order");

  // Verify the provided pickup code
  if (!shippingRecord.pickupCode) throw new Error("No pickup code set for this order");
  if (shippingRecord.pickupCode !== providedCode) throw new Error("Invalid pickup code");

  // Update order status to delivered
  await db.update(orders)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Update shipping status to delivered
  await db.update(shipping)
    .set({ status: "delivered" })
    .where(eq(shipping.id, shippingRecord.id));

  return { message: "Order successfully delivered", orderId };
};


//Get orders by agent id
export const getOrdersByAgentIdService = async (agentId: number) => {
  const sellerUser = alias(users, "sellerUser");

  const rows = await db
    .select({
      // Order
      orderId: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,

      // Customer
      customerId: users.id,
      customerName: users.firstname,

      // Shop
      shopId: shops.id,
      shopName: shops.name,

      // Seller
      sellerId: sellers.id,
      sellerName: sellerUser.firstname,

      // Item
      itemId: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,

      // Product
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productImage: productImages.imageUrl,

      // Shipping
      shippingStatus: shipping.status,
      estimatedDelivery: shipping.estimatedDelivery,
    })
    .from(shipping)
    .innerJoin(orders, eq(shipping.orderId, orders.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
     .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isMain, true)
      )
    )
    .leftJoin(shops, eq(orderItems.shopId, shops.id))
    .leftJoin(sellers, eq(shops.sellerId, sellers.id))
    .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
    .where(eq(shipping.pickupAgentId, agentId));

  if (!rows.length) return [];

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

        customer: {
          id: row.customerId,
          name: row.customerName,
        },

        seller: {
          id: row.sellerId,
          name: row.sellerName,
        },

        shop: {
          id: row.shopId,
          name: row.shopName,
        },

        shipping: {
          status: row.shippingStatus,
          estimatedDelivery: row.estimatedDelivery,
        },

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

//GET ALL STATIONS AND AGENTS 
export const getStationsAndAgentsService = async () => {

  // Stations
  const stationList = await db
    .select({
      id: stations.id,
      name: stations.name,
      county: stations.county,
      area: stations.area,
      address: stations.address,
      isStation: sql<boolean>`true`.as("isStation"),
    })
    .from(stations)
    .where(eq(stations.isActive, true));

  const agentList = await db
    .select({
      id: agents.id,
      name: users.firstname, 
      county: agents.county,
      area: agents.area,
      address: agents.address,
      isStation: sql<boolean>`false`.as("isStation"),
    })
    .from(agents)
    .innerJoin(users, eq(agents.userId, users.id))
    .where(eq(agents.isActive, true));

  return [...stationList, ...agentList];
};

//Get orders by station id
export const getOrdersByStationIdService = async (stationId: number) => {
  const sellerUser = alias(users, "sellerUser");

  const rows = await db
    .select({
      // Order
      orderId: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,

      // Customer
      customerId: users.id,
      customerName: users.firstname,

      // Shop
      shopId: shops.id,
      shopName: shops.name,

      // Seller
      sellerId: sellers.id,
      sellerName: sellerUser.firstname,

      // Item
      itemId: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,

      // Product
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productImage: productImages.imageUrl,

      // Shipping
      shippingStatus: shipping.status,
      estimatedDelivery: shipping.estimatedDelivery,
    })
    .from(shipping)
    .innerJoin(orders, eq(shipping.orderId, orders.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
     .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isMain, true)
      )
    )
    .leftJoin(shops, eq(orderItems.shopId, shops.id))
    .leftJoin(sellers, eq(shops.sellerId, sellers.id))
    .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
    .where(eq(shipping.pickupStationId, stationId));

  if (!rows.length) return [];

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

        customer: {
          id: row.customerId,
          name: row.customerName,
        },

        seller: {
          id: row.sellerId,
          name: row.sellerName,
        },

        shop: {
          id: row.shopId,
          name: row.shopName,
        },
        shipping: {
          status: row.shippingStatus,
          estimatedDelivery: row.estimatedDelivery,
        },

        items: [],
      });
    }

    // Push items
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

//Get orders by origin station id
export const getOrdersByOriginStationIdService = async (stationId: number) => {
  const sellerUser = alias(users, "sellerUser");

  const rows = await db
    .select({
      // Order
      orderId: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,

      // Customer
      customerId: users.id,
      customerName: users.firstname,

      // Shop
      shopId: shops.id,
      shopName: shops.name,

      // Seller
      sellerId: sellers.id,
      sellerName: sellerUser.firstname,

      // Item
      itemId: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,

      // Product
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productImage: productImages.imageUrl, 

      // Shipping
      shippingStatus: shipping.status,
      estimatedDelivery: shipping.estimatedDelivery,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(shipping, eq(orders.id, shipping.orderId))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isMain, true)
      )
    )

    .leftJoin(shops, eq(orderItems.shopId, shops.id))
    .leftJoin(sellers, eq(shops.sellerId, sellers.id))
    .leftJoin(sellerUser, eq(sellers.userId, sellerUser.id))
    .where(eq(orders.originStationId, stationId));

  if (!rows.length) return [];

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

        customer: {
          id: row.customerId,
          name: row.customerName,
        },

        seller: {
          id: row.sellerId,
          name: row.sellerName,
        },

        shop: {
          id: row.shopId,
          name: row.shopName,
        },

        shipping: {
          status: row.shippingStatus,
          estimatedDelivery: row.estimatedDelivery,
        },

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