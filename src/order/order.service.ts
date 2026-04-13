
import db from "../Drizzle/db";
import { eq, and, inArray } from "drizzle-orm";
import { orders, orderItems, products, payments, shops, shipping, stations, agents, users, sellers, productImages, returns, TSShipping } from "../Drizzle/schema";
import { sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendEmail } from "../mailer/mailer";
import crypto from "crypto";
import { processReturnExchangeService, processReturnRefundService } from "../return/return.sevice";

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

export const createOrUpdateOrderService = async (
  userId: number,
  items: { productId: number; quantity: number }[],
  pickupStationId?: number | null,
  pickupAgentId?: number | null
) => {
  let existingOrder = await db.query.orders.findFirst({
    where: and(eq(orders.userId, userId), eq(orders.paymentStatus, "unpaid")),
  });

  // CREATE NEW ORDER
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
      })
      .returning();

    const newOrder = insertResult[0];
    if (!newOrder) throw new Error("Failed to create new order");

    existingOrder = newOrder;
  } else {
    // UPDATE EXISTING ORDER
    await db
      .update(orders)
      .set({
        pickupStationId:
          pickupStationId !== undefined
            ? pickupStationId
            : existingOrder.pickupStationId,

        pickupAgentId:
          pickupAgentId !== undefined
            ? pickupAgentId
            : existingOrder.pickupAgentId,
      })
      .where(eq(orders.id, existingOrder.id));
  }

  if (!existingOrder) {
    throw new Error("Order could not be created or found");
  }

  // ADD / UPDATE ITEMS
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
        originStationId: null,
      });
    }
  }

  // RECALCULATE TOTAL
  const totalAmount = await calculateTotalAmount(existingOrder.id);
  await db
    .update(orders)
    .set({ totalAmount })
    .where(eq(orders.id, existingOrder.id));


  return {
    message: "Order updated successfully",
    orderId: existingOrder.id,
    totalAmount,

    pickupStationId:
      pickupStationId !== undefined
        ? pickupStationId
        : existingOrder.pickupStationId ?? null,

    pickupAgentId:
      pickupAgentId !== undefined
        ? pickupAgentId
        : existingOrder.pickupAgentId ?? null,
  };
};

// Get all orders
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
  const itemsWithReplacements = order.items.map((item: any) => {
  const isAssignedToOrigin = !!item.originStationId;

  const itemReturns = returnRecords.filter((r) => r.orderItemId === item.id);

  const replacements = itemReturns
    .map((r) =>
      replacementItems
        .filter((ri) => ri.replacementForReturnId === r.returnId)
        .map((ri) => ({
          ...ri,
          product: {
            productId: ri.productId,
            productImage:
              replacementImages.find((img) => img.productId === ri.productId)?.imageUrl || null,
          },
        }))
    )
    .flat();

  return {
    ...item,
    isAssignedToOrigin,
    returns: itemReturns,
    replacements,
  };
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


type ShippingRecord = TSShipping;

type OrderWithRelations = {
  id: number;
  items: any[];
  shipping: ShippingRecord[];
  user: any;
  status: string;
  originStationId?: number | null;
  pickupStationId?: number | null;
  pickupAgentId?: number | null; 
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

  return {
    id: order.id,
    status: order.status,
    originStationId: order.originStationId ?? null,
    pickupStationId: order.pickupStationId ?? null,
    pickupAgentId: order.pickupAgentId ?? null,
    paymentStatus: order.paymentStatus ?? undefined,
    items,
    shipping: shippingRecords, 
    user,
  };
};

export const assignOriginStationServiceEx = async (
  orderItemId: number,
  stationId: number
) => {
  const item = await db.query.orderItems.findFirst({
    where: eq(orderItems.id, orderItemId),
    with: {
      order: {
        with: {
          user: true,
          shipping: {
            with: {
              pickupStation: true,
            },
          },
        },
      },
    },
  });

  if (!item) throw new Error("Order item not found");

  if (item.order.paymentStatus !== "paid") {
    throw new Error("Only paid orders can be assigned an origin station");
  }

  if (item.originStationId) {
    throw new Error("Item already assigned to a station");
  }

  //Assign station
  await db
    .update(orderItems)
    .set({ originStationId: stationId })
    .where(eq(orderItems.id, orderItemId));

  //Check if shipment already exists
  let shipment = item.order.shipping.find(
    (s) => s.orderItemId === orderItemId
  );

  const isReplacement = !!item.replacementForReturnId;

  //Create shipment if not exists
  if (!shipment) {
    const [newShipment] = await db.insert(shipping).values({
      orderId: item.orderId,
      orderItemId: orderItemId,
      originStationId: stationId,
      pickupStationId: item.order.pickupStationId || null,
      pickupAgentId: item.order.pickupAgentId || null,
      type: isReplacement ? "replacement" : "standard",
      status: "preparing",
      recipientName: `${item.order.user.firstname} ${item.order.user.lastname}`,
      recipientPhone: item.order.user.phone ?? null,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    })
    .returning();

    shipment = newShipment;

      // If replacement, update the return record with the shipment ID
    if (isReplacement) {
      await db.update(returns)
        .set({ replacementShipmentId: shipment.id })
        .where(eq(returns.id, item.replacementForReturnId));
    }
  }

  return {
    message: "Origin station assigned and shipment created",
    orderId: item.orderId,
    orderItemId,
    stationId,
    shipmentId: shipment?.id,
    customer: item.order.user
      ? {
          id: item.order.user.id,
          name: `${item.order.user.firstname} ${item.order.user.lastname}`,
        }
      : null,
    destination: shipment?.pickupStation || null,
  };
};


// export const markOrderAsShippedServiceEx = async (orderItemId: number) => {
//   const order = await getOrderForShipping(orderItemId);
//   if (!order) throw new Error("Order not found");

//   if (!order.items || order.items.length === 0) {
//     throw new Error("Order has no items");
//   }

//   const existingShipping = await db.query.shipping.findMany({
//     where: eq(shipping.orderId, order.id),
//   });

//   const itemShipping = existingShipping.find(
//     (s) => s.orderItemId === orderItemId
//   );

//   const item = await db.query.orderItems.findFirst({
//     where: eq(orderItems.id, orderItemId),
//   });
//   if (!item?.originStationId) throw new Error("Item must be assigned to a station before shipping");

//   const isReplacement = !!item?.replacementForReturnId;

//  if (
//   itemShipping &&
//   itemShipping.status &&
//   !isReplacement &&
//   ["in_transit", "ready_for_pickup", "delivered"].includes(itemShipping.status)
//  ) {
//   throw new Error("Item already shipped");
//  }
//   if (itemShipping) {
//     await db
//       .update(shipping)
//       .set({ status: "in_transit" })
//       .where(eq(shipping.id, itemShipping.id));
//   } else {
//     await db.insert(shipping).values({
//       orderId: order.id,
//       orderItemId,
//       status: "in_transit",
//       originStationId: item.originStationId,
//     });
//   }

//   const allShippingRecords = await db.query.shipping.findMany({
//     where: eq(shipping.orderId, order.id),
//   });

//   const shippedItemIds = new Set(
//     allShippingRecords
//       .filter((s) => s.status === "in_transit" || s.status === "delivered")
//       .map((s) => s.orderItemId)
//       .filter((id): id is number => !!id)
//   );

//   const shippedCount = shippedItemIds.size;
//   const totalItems = order.items.length;

//   let newOrderStatus: typeof order.status;
//   if (shippedCount === 0) newOrderStatus = "at_station";
//   else if (shippedCount < totalItems) newOrderStatus = "processing";
//   else newOrderStatus = "shipped";

//   await db
//     .update(orders)
//     .set({ status: newOrderStatus, updatedAt: new Date() })
//     .where(eq(orders.id, order.id));

//   return {
//     message: `Item shipped. Order now ${newOrderStatus}`,
//     orderId: order.id,
//     orderItemId,
//   };
// };


export const markOrderAsShippedServiceEx = async (orderItemId: number) => {
  const order = await getOrderForShipping(orderItemId);
  if (!order) throw new Error("Order not found");

  if (!order.items || order.items.length === 0) {
    throw new Error("Order has no items");
  }

  const item = await db.query.orderItems.findFirst({
    where: eq(orderItems.id, orderItemId),
  });
  if (!item) throw new Error("Order item not found");

  //Detect type
  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.orderItemId, orderItemId),
  });

  const isReturn = !!returnRecord && !item.replacementForReturnId;
  const isReplacement = !!item.replacementForReturnId;

  const shippingType = isReturn
    ? "return"
    : isReplacement
    ? "replacement"
    : "standard";

  //Validation
  if (!isReturn && !item.originStationId) {
    throw new Error("Item must be assigned to a station before shipping");
  }

  const existingShipping = await db.query.shipping.findMany({
    where: eq(shipping.orderId, order.id),
  });

  const itemShipping = existingShipping.find(
    (s) => s.orderItemId === orderItemId && s.type === shippingType
  );

  if (
    itemShipping &&
    itemShipping.status &&
    isReplacement &&
    ["in_transit", "ready_for_pickup", "delivered"].includes(itemShipping.status)
  ) {
    throw new Error("Item already shipped");
  }

  //CREATE / UPDATE SHIPPING
const pickupLocationStationId = order.pickupStationId ?? null;
const pickupLocationAgentId = order.pickupAgentId ?? null;

if (!pickupLocationStationId && !pickupLocationAgentId) {
  throw new Error("Order has no pickup location assigned");
}
  if (itemShipping) {
    await db
      .update(shipping)
      .set({ status: "in_transit" })
      .where(eq(shipping.id, itemShipping.id));
  } else {
    await db.insert(shipping).values({
      orderId: order.id,
      orderItemId,
      type: shippingType,
      status: "in_transit",

      //Direction handling
     originStationId: isReturn
     ? pickupLocationStationId
     : item.originStationId,

      pickupStationId: isReturn
      ? item.originStationId
      : pickupLocationStationId,

      pickupAgentId: isReturn
      ? null
      : pickupLocationAgentId,
    });
  }

  //RETURN FLOW 
  if (isReturn && returnRecord) {
    await db
      .update(returns)
      .set({
        status: "in_transit",
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnRecord.id));

    return {
      message: "Return shipment in transit",
      orderId: order.id,
      orderItemId,
      type: "return",
    };
  }

  //NORMAL / REPLACEMENT FLOW
  const allShippingRecords = await db.query.shipping.findMany({
    where: eq(shipping.orderId, order.id),
  });

  const shippedItemIds = new Set(
    allShippingRecords
      .filter(
        (s) =>
          s.type !== "return" &&
          (s.status === "in_transit" || s.status === "delivered")
      )
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
    type: shippingType,
  };
};

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

  // Get all shipments for this order
  const shipments = await db.query.shipping.findMany({
    where: eq(shipping.orderId, order.id)
  });

  if (!shipments.length) {
    throw new Error("No shipments found for this order");
  }

  // Ensure all items are shipped
  const shippedItemIds = new Set(
    shipments
      .filter((s) => s.status === "in_transit" || s.status === "delivered")
      .map((s) => s.orderItemId)
      .filter((id): id is number => !!id)
  );

  if (shippedItemIds.size < order.items.length) {
    throw new Error("Cannot mark ready for pickup: not all items have been shipped");
  }

  // Generate ONE pickup code for the whole order
  const pickupCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  // Update ALL shipments
  for (const s of shipments) {
    await db.update(shipping)
      .set({
        status: "ready_for_pickup",
        pickupCode,
      })
      .where(eq(shipping.id, s.id));
  }

  // Send email once
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
    pickupCode,
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
  const returnWindowDays = 3;

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

// export const markReturnAsReceivedService = async (
//   orderItemId: number
// ) => {
//   const returnRecord = await db.query.returns.findFirst({
//     where: eq(returns.orderItemId, orderItemId),
//   });

//   if (!returnRecord) throw new Error("Return not found");

//   if (returnRecord.status !== "approved") {
//     throw new Error("Return not in transit or not approved");
//   }

//   const shippingRecord = await db.query.shipping.findFirst({
//     where: eq(shipping.orderItemId, orderItemId),
//   });

//   if (!shippingRecord) {
//     throw new Error("Shipping record not found");
//   }

//   const now = new Date();

//   //update shipping
//   await db
//     .update(shipping)
//     .set({
//       status: "delivered",
//       deliveredAt: now,
//     })
//     .where(eq(shipping.id, shippingRecord.id));

//   //update return
//   await db
//     .update(returns)
//     .set({
//       status: "received",
//       processedAt: now,
//       updatedAt: now,
//     })
//     .where(eq(returns.id, returnRecord.id));

//   return {
//     message: "Return successfully received",
//     orderItemId,
//     returnId: returnRecord.id,
//   };
// };


export const markReturnAsReceivedService = async (
  orderItemId: number
) => {
  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.orderItemId, orderItemId),
  });

  if (!returnRecord) throw new Error("Return not found");

  if (returnRecord.status !== "approved") {
    throw new Error("Return must be approved before receiving");
  }

  const shippingRecord = await db.query.shipping.findFirst({
    where: eq(shipping.orderItemId, orderItemId),
  });

  if (!shippingRecord) {
    throw new Error("Shipping record not found");
  }

  const now = new Date();

  //Update shipping 
  await db.update(shipping)
    .set({
      status: "delivered",
      deliveredAt: now,
    })
    .where(eq(shipping.id, shippingRecord.id));

  //Update return 
  await db.update(returns)
    .set({
      status: "received",
      processedAt: now,
      updatedAt: now,
    })
    .where(eq(returns.id, returnRecord.id));

  //process resolution 
  let result;

  switch (returnRecord.resolutionType) {
    case "exchange":
      result = await processReturnExchangeService([returnRecord.id]);
      break;

    case "refund":
      result = await processReturnRefundService([returnRecord.id]);
      break;

    case "store_credit":
      result = await processReturnRefundService([returnRecord.id]);
      break;

    default:
      throw new Error("Invalid resolution type");
  }

  if (!result?.[0]?.success) {
    throw new Error(result?.[0]?.error || "Return processing failed");
  }

  return {
    message: "Return received and processed successfully",
    orderItemId,
    returnId: returnRecord.id,
    resolution: returnRecord.resolutionType,
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

  const itemsWithStatus = order.items.map((item) => {
    const shipment = order.shipping.find(
      (s) => s.orderItemId === item.id
    );

    return {
      itemId: item.id,
      productName: item.product.name,
      shippingStatus: shipment?.status || "unknown",
      isAtPickupPoint: shipment?.status === "ready_for_pickup",
    };
  });

  const allReady = itemsWithStatus.every(i => i.isAtPickupPoint);

  return {
    isReady: allReady,
    items: itemsWithStatus,
  };
};


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
    .from(orders)
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

export const getOrdersByOriginStationIdService = async (stationId: number) => {
  const ordersList = await db.query.orders.findMany({
    where: (orders, { exists }) =>
      exists(
        db
          .select()
          .from(orderItems)
          .where(
            and(
              eq(orderItems.orderId, orders.id),
              eq(orderItems.originStationId, stationId)
            )
          )
      ),
    with: {
      items: {
        with: {
          product: true,
          shop: {
            with: {
              seller: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
      },
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
      .select({
        productId: productImages.productId,
        imageUrl: productImages.imageUrl,
      })
      .from(productImages)
      .where(
        and(
          inArray(productImages.productId, productIds),
          eq(productImages.isMain, true)
        )
      );

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
      .where(
        inArray(
          orderItems.replacementForReturnId,
          returnRecords.map((r) => r.returnId).filter(Boolean)
        )
      );

    // Main images for replacement products
    const replacementProductIds = replacementItems.map(
      (ri: any) => ri.productId
    );

    const replacementImages = await db
      .select({
        productId: productImages.productId,
        imageUrl: productImages.imageUrl,
      })
      .from(productImages)
      .where(
        and(
          inArray(productImages.productId, replacementProductIds),
          eq(productImages.isMain, true)
        )
      );

    // Final item transformation
    order.items = order.items.map((item: any) => {
      const itemShipment = order.shipping.find(
        (shipment: any) => shipment.orderItemId === item.id
      );

      const shippingStatus = itemShipment?.status ?? "not_shipped";

      const isShipped = !!itemShipment &&
        ["in_transit", "delivered", "ready_for_pickup"].includes(
          itemShipment.status
        );

      const itemReturns = returnRecords.filter(
        (r) => r.orderItemId === item.id
      );

      const returnsWithReplacements = itemReturns.map((r) => ({
        ...r,
        replacements: replacementItems
          .filter((ri) => ri.replacementForReturnId === r.returnId)
          .map((ri) => ({
            ...ri,
            productImage:
              replacementImages.find(
                (img) => img.productId === ri.productId
              )?.imageUrl || null,
          })),
      }));

      return {
        ...item,
        isShipped,
        shippingStatus,
        product: {
          ...item.product,
          productImage:
            mainImages.find((img) => img.productId === item.productId)
              ?.imageUrl || null,
        },
        seller: item.shop?.seller?.user
          ? {
              id: item.shop.seller.user.id,
              name: `${item.shop.seller.user.firstname} ${item.shop.seller.user.lastname}`,
            }
          : null,
        returns: returnsWithReplacements,
      };
    });
  }

  return ordersList;
};