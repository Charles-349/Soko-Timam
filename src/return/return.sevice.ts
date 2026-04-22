import db from "../Drizzle/db";
import { eq, sql, and, or } from "drizzle-orm";
import {
  returns,
  refunds,
  orders,
  orderItems,
  shops,
  shipping,
  users,
  products,
  agents,
  stations,
  sellers,
  productImages,
} from "../Drizzle/schema";

import { processBulkReturns } from "./processors/bulkReturnProcessor";
import { resolveReturn } from "./resolutions/resolveReturn";
import { sendEmail } from "../mailer/mailer";
import { storeCreditResolution } from "./resolutions/storeCreditResolution";
import { refundResolution } from "./resolutions/refundResolution";
import { exchangeResolution } from "./resolutions/exchangeResolution";

// CREATE RETURN REQUEST
export type ReturnRow = {
  id: number;
  status:
    | "requested"
    | "approved"
    | "rejected"
    | "received"
    | "refunded"
    | "exchanged"
    | "closed"
    | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: number;
  sellerId: number;
  orderId: number;
  quantity: number;
  orderItemId: number;
  reason: string;
  resolutionType: "refund" | "store_credit" | "exchange" | null;
  refundAmount: string | null;
  customerNote: string | null;
  adminNote: string | null;
  evidenceUrl: string | null;
  processedAt: Date | null;
};

export const createReturnService = async ({
  orderItemIds,
  reason,
  resolutionType, 
}: {
  orderItemIds: number[];
  reason: string;
  resolutionType: "refund" | "store_credit" | "exchange";
}): Promise<ReturnRow[]> => {

  if (!orderItemIds?.length)
    throw new Error("No order items specified");

  if (!resolutionType)
    throw new Error("Resolution type must be specified");

  const returnRecords: ReturnRow[] = [];
  const affectedOrderIds = new Set<number>();

  for (const itemId of orderItemIds) {

    const orderItemRows = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, itemId));

    const orderItem = orderItemRows[0];

    if (!orderItem)
      throw new Error(`Order item ${itemId} not found`);

    const existingReturnRows = await db
      .select()
      .from(returns)
      .where(eq(returns.orderItemId, itemId));

    const existingReturn = existingReturnRows[0];

    if (existingReturn)
      throw new Error(`Return already exists for order item ${itemId}`);

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderItem.orderId));

    const order = orderRows[0];

    if (!order)
      throw new Error(`Order not found for item ${itemId}`);

    // RETURN WINDOW VALIDATION
    if (!order.returnWindowEndsAt)
      throw new Error("Return window not initialized");

    const now = new Date();
    const windowEnd = new Date(order.returnWindowEndsAt);

    if (now > windowEnd)
      throw new Error("Return window expired");

    const userId = order.userId ?? 0;

    const shopRows = await db
      .select()
      .from(shops)
      .where(eq(shops.id, orderItem.shopId));

    const shop = shopRows[0];

    if (!shop)
      throw new Error(`Shop not found for order item ${itemId}`);

    const sellerId = shop.sellerId;

    const insertedRows = await db
      .insert(returns)
      .values({
        orderItemId: itemId,
        orderId: orderItem.orderId,
        sellerId,
        userId,
        reason,
        resolutionType, 
        refundAmount: sql`${Number(orderItem.price) * Number(orderItem.quantity)}`,
        status: "requested",
      })
      .returning();

    const returnRecord = insertedRows[0];

    returnRecords.push(returnRecord);
    affectedOrderIds.add(orderItem.orderId);
  }

  // LOCK ESCROW FOR AFFECTED ORDERS
  for (const orderId of affectedOrderIds) {

    await db
      .update(orders)
      .set({
        isEscrowLocked: true,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

  }

  return returnRecords;
};


export const processReturnRefundService = async (returnIds: number[]) => {
  if (!returnIds.length) throw new Error("No return IDs provided");

  // Use the unified resolver 
  return processBulkReturns(returnIds, resolveReturn);
};

export const processReturnExchangeService = async (returnIds: number[]) => {
  if (!returnIds.length) throw new Error("No return IDs provided");

  // Use the unified resolver 
  return processBulkReturns(returnIds, resolveReturn);
};

// export const reviewReturnService = async ({
//   returnId,
//   action, 
//   resolutionType, 
//   refundResponsibility, 
//   adminNote,
// }: {
//   returnId: number;
//   action: "approve" | "reject";
//   resolutionType?: string;
//   refundResponsibility?: string;
//   adminNote?: string;
// }) => {
//   const [returnRecord] = await db
//     .select()
//     .from(returns)
//     .where(eq(returns.id, returnId));

//   if (!returnRecord) throw new Error("Return not found");

//   if (returnRecord.status !== "requested")
//     throw new Error("Return already processed");

//   if (action === "reject") {
//     await db
//       .update(returns)
//       .set({
//         status: "rejected",
//         adminNote,
//         updatedAt: new Date(),
//       })
//       .where(eq(returns.id, returnId));

//     // Unlock escrow immediately if rejected
//     await db
//       .update(orders)
//       .set({
//         isEscrowLocked: false,
//         escrowLockedAmount: "0",
//         updatedAt: new Date(),
//       })
//       .where(eq(orders.id, returnRecord.orderId));

//     return { message: "Return rejected" };
//   }

//   // APPROVE FLOW
//   if (!resolutionType)
//     throw new Error("Resolution type required for approval");

//   // const refundAmount = Number(returnRecord.refundAmount || 0);

//   // // Increase locked escrow amount
//   // await db
//   //   .update(orders)
//   //   .set({
//   //     escrowLockedAmount: sql`
//   //       ${orders.escrowLockedAmount} + ${refundAmount}
//   //     `,
//   //     updatedAt: new Date(),
//   //   })
//   //   .where(eq(orders.id, returnRecord.orderId));

//   await db
//     .update(returns)
//     .set({
//       status: "approved",
//       resolutionType: resolutionType as "refund" | "exchange" | "store_credit",
//       refundResponsibility,
//       adminNote,
//       updatedAt: new Date(),
//     })
//     .where(eq(returns.id, returnId));

//     //ensure fresh state
//   const [updatedReturn] = await db
//   .select()
//   .from(returns)
//   .where(eq(returns.id, returnId));

//     if (!updatedReturn || updatedReturn.status !== "approved") {
//     throw new Error("Return not properly approved");
//     }

//     let result;
//     if (resolutionType === "exchange") {
//       await processReturnExchangeService([returnId]);
//     } else if (resolutionType === "refund") {
//       await processReturnRefundService([returnId]);
//     } else if (resolutionType === "store_credit") {
//       await processReturnRefundService([returnId]);

//     if (!result?.[0]?.success) {
//     throw new Error(result?.[0]?.error || "Return processing failed");
//     }
//     }

//   return { message: "Return approved and processed" };
// };

// export const reviewReturnService = async ({
//   returnId,
//   action,
//   resolutionType,
//   refundResponsibility,
//   adminNote,
// }: {
//   returnId: number;
//   action: "approve" | "reject";
//   resolutionType?: "refund" | "exchange" | "store_credit";
//   refundResponsibility?: string;
//   adminNote?: string;
// }) => {
//   const [returnRecord] = await db
//     .select()
//     .from(returns)
//     .where(eq(returns.id, returnId));

//   if (!returnRecord) throw new Error("Return not found");
//   if (returnRecord.status !== "requested") throw new Error("Return already processed");

//   // REJECT FLOW
//   if (action === "reject") {
//     await db
//       .update(returns)
//       .set({
//         status: "rejected",
//         adminNote,
//         updatedAt: new Date(),
//       })
//       .where(eq(returns.id, returnId));

//     await db
//       .update(orders)
//       .set({
//         isEscrowLocked: false,
//         escrowLockedAmount: "0",
//         updatedAt: new Date(),
//       })
//       .where(eq(orders.id, returnRecord.orderId));

//     return { message: "Return rejected" };
//   }

//   // APPROVE FLOW
//   if (!resolutionType) throw new Error("Resolution type required for approval");

//   await db
//     .update(returns)
//     .set({
//       status: "approved",
//       resolutionType,
//       refundResponsibility,
//       adminNote,
//       updatedAt: new Date(),
//     })
//     .where(eq(returns.id, returnId));

//   // REFRESH RETURN
//   const [updatedReturn] = await db
//     .select()
//     .from(returns)
//     .where(eq(returns.id, returnId));

//   if (!updatedReturn || updatedReturn.status !== "approved") {
//     throw new Error("Return not properly approved");
//   }

//   // PROCESS RETURN RESOLUTION
//   let result;
//   switch (resolutionType) {
//     case "exchange":
//       result = await processReturnExchangeService([returnId]);
//       break;
//     case "refund":
//       result = await processReturnRefundService([returnId]);
//       break;
//     case "store_credit":
//       result = await processReturnRefundService([returnId]); 
//       break;
//     default:
//       throw new Error("Unsupported resolution type");
//   }

//   if (!result?.[0]?.success) {
//     throw new Error(result?.[0]?.error || "Return processing failed");
//   }

//   return { message: "Return approved and processed" };
// };


export const reviewReturnService = async ({
  returnId,
  action,
  resolutionType,
  refundResponsibility,
  adminNote,
}: {
  returnId: number;
  action: "approve" | "reject";
  resolutionType?: "refund" | "exchange" | "store_credit";
  refundResponsibility?: string;
  adminNote?: string;
}) => {
  const [returnRecord] = await db
    .select()
    .from(returns)
    .where(eq(returns.id, returnId));

  if (!returnRecord) throw new Error("Return not found");

  if (returnRecord.status !== "requested") {
    throw new Error("Return already processed");
  }

  const now = new Date();

  //REJECT FLOW
  if (action === "reject") {
    await db.update(returns).set({
      status: "rejected",
      adminNote,
      updatedAt: now,
    }).where(eq(returns.id, returnId));

    await db.update(orders).set({
      isEscrowLocked: false,
      escrowLockedAmount: "0",
      updatedAt: now,
    }).where(eq(orders.id, returnRecord.orderId));

    return { message: "Return rejected" };
  }

  //APPROVE FLOW 
  if (!resolutionType) {
    throw new Error("Resolution type required for approval");
  }

  await db.update(returns).set({
    status: "approved",
    resolutionType,
    refundResponsibility,
    adminNote,
    updatedAt: now,
  }).where(eq(returns.id, returnId));

  const orderItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, returnRecord.orderItemId),
    });
  
    if (!orderItem) throw new Error("Order item not found");

  const order = await db.query.orders.findFirst({
     where: eq(orders.id, orderItem.orderId),
     with: { user: true },
   });

//   if (order && order.user?.email) {
//   await sendEmail(
    // order.user.email,
    // "Return Approved - Action Required",
    // `Hi ${order.user.firstname}, your return request for order #${order.id} has been approved. Please take the item back to your original pickup point for processing.`,
    // `<p>Hi ${order.user.firstname},</p>
    //  <p>Your return request for <strong>Order #${order.id}</strong> has been <strong>approved</strong>.</p>
    //  <p>Please take the item back to the original pickup station where you collected it.</p>
    //  <p>Our team will receive and process it once it arrives.</p>
    //  <br/>
    //  <p>Regards,<br/>Sokotimam Support Team</p>`
//   );
// }

if (order?.user?.email) {
    await sendEmail(
    order.user.email,
    "Return Approved - Action Required",
    `Hi ${order.user.firstname}, your return request for order #${order.id} has been approved. Please take the item back to your original pickup point for processing.`,
    `<p>Hi ${order.user.firstname},</p>
     <p>Your return request for <strong>Order #${order.id}</strong> has been <strong>approved</strong>.</p>
     <p>Please take the item back to the original pickup station where you collected it.</p>
     <p>Our team will receive and process it once it arrives.</p>
     <br/>
     <p>Regards,<br/>Sokotimam Support Team</p>`
    );
  }

  return {
    message: "Return approved. Awaiting item return",
    returnId,
    nextStep: "Ship item back to origin",
  };
};

//shippment delivery service
export const handleReplacementShipmentDeliveredService = async (
  shipmentId: number
) => {
  const shipmentRows = await db
    .select()
    .from(shipping)
    .where(eq(shipping.id, shipmentId));

  const shipment = shipmentRows[0];

  if (!shipment)
    throw new Error("Shipment not found");

  if (shipment.type !== "replacement")
    return { message: "Shipment is not a replacement shipment" };

  const returnRows = await db
    .select()
    .from(returns)
    .where(eq(returns.replacementShipmentId, shipmentId));

  const returnRecord = returnRows[0];

  if (!returnRecord)
    throw new Error("Return record not found for shipment");

  // CLOSE RETURN
  await db
    .update(returns)
    .set({
      status: "closed",
      updatedAt: new Date(),
    })
    .where(eq(returns.id, returnRecord.id));

  // UNLOCK ESCROW
  await db
    .update(orders)
    .set({
      isEscrowLocked: false,
      escrowLockedAmount: "0",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, returnRecord.orderId));

  return {
    message: "Replacement delivered. Return closed and escrow unlocked",
    returnId: returnRecord.id,
    orderId: returnRecord.orderId,
  };
};

// GET RETURNS 
// export const getReturnsService = async (filters?: { status?: ReturnRow["status"]; sellerId?: number }) => {
//   const conditions: (ReturnType<typeof eq> | ReturnType<typeof and>)[] = [];
//   if (filters?.status) conditions.push(eq(returns.status, filters.status));
//   if (filters?.sellerId) conditions.push(eq(returns.sellerId, filters.sellerId));

//   return await db.query.returns.findMany({
//     where: conditions.length ? and(...conditions) : undefined,
//     with: { orderItem: true },
//     orderBy: (r, { desc }) => [desc(r.createdAt)],
//   });
// };


export const getReturnsService = async (filters?: { 
  status?: ReturnRow["status"]; 
  sellerId?: number 
}) => {
  const conditions: (ReturnType<typeof eq> | ReturnType<typeof and>)[] = [];

  if (filters?.status) {
    conditions.push(eq(returns.status, filters.status));
  }

  if (filters?.sellerId) {
    conditions.push(eq(returns.sellerId, filters.sellerId));
  }

  return await db.query.returns.findMany({
    where: conditions.length ? and(...conditions) : undefined,

    with: {
      orderItem: {
        with: {
          product: {
            with: {
              images: {
                where: (img, { eq }) => eq(img.isMain, true), 
              },
            },
          },
        },
      },
    },

    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
};

//GET SINGLE RETURN WITH REFUNDS
// export const getReturnByIdService = async (returnId: number) => {
//   const returnRecord = await db.query.returns.findFirst({
//     where: eq(returns.id, returnId),
//     with: { orderItem: true },
//   });
//   if (!returnRecord) throw new Error("Return not found");

//   const refundRecords = await db.select().from(refunds).where(eq(refunds.returnId, returnId));

//   return { ...returnRecord, refunds: refundRecords };
// };

export const getReturnByIdService = async (returnId: number) => {
  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.id, returnId),

    with: {
      orderItem: {
        with: {
          product: {
            with: {
              images: {
                where: (img, { eq }) => eq(img.isMain, true), 
              },
            },
          },
        },
      },
    },
  });

  if (!returnRecord) {
    throw new Error("Return not found");
  }

  const refundRecords = await db
    .select()
    .from(refunds)
    .where(eq(refunds.returnId, returnId));

  return {
    ...returnRecord,
    refunds: refundRecords,
  };
};

// export const processFinalReturnResolution = async (returnId: number) => {
//   const [returnRecord] = await db
//     .select()
//     .from(returns)
//     .where(eq(returns.id, returnId));

//   if (!returnRecord) throw new Error("Return not found");

//   //Block already finalized states 
//   if (["refunded", "exchanged", "closed"].includes(returnRecord.status)) {
//     throw new Error("Return already resolved");
//   }

//   if (returnRecord.status !== "received") {
//     throw new Error("Return must be received before resolution");
//   }

//   const now = new Date();

//   //prevent double processing
//   const locked = await db
//     .update(returns)
//     .set({
//       status: "processing",
//       updatedAt: now,
//     })
//     .where(
//       and(
//         eq(returns.id, returnId),
//         eq(returns.status, "received")
//       )
//     )
//     .returning();

//   if (!locked.length) {
//     throw new Error("Return is already being processed");
//   }

//   try {
//     let data;

//     //Execute resolution
//     switch (returnRecord.resolutionType) {
//       case "exchange":
//         data = await exchangeResolution(returnRecord);
//         break;

//       case "refund":
//         data = await refundResolution(returnRecord);
//         break;

//       case "store_credit":
//         data = await storeCreditResolution(returnRecord);
//         break;

//       default:
//         throw new Error("Invalid resolution type");
//     }

//     // FINAL STATE 
//     await db
//       .update(returns)
//       .set({
//         status: "closed",
//         updatedAt: now,
//       })
//       .where(eq(returns.id, returnId));

//     return {
//       message: "Return resolved successfully",
//       returnId,
//       data,
//     };
//   } catch (error: any) {
//     //Rollback to safe state
//     await db
//       .update(returns)
//       .set({
//         status: "received",
//         updatedAt: now,
//       })
//       .where(eq(returns.id, returnId));

//     throw error;
//   }
// };

export const processFinalReturnResolution = async (
  returnId: number,
  override?: {
    resolutionType?: "refund" | "exchange" | "store_credit";
    refundResponsibility?: string;
  }
) => {
  const [returnRecord] = await db
    .select()
    .from(returns)
    .where(eq(returns.id, returnId));

  if (!returnRecord) throw new Error("Return not found");

  // Block already finalized states
  if (["refunded", "exchanged", "closed"].includes(returnRecord.status)) {
    throw new Error("Return already resolved");
  }

  // Must be in received stage
  if (returnRecord.status !== "received") {
    throw new Error("Return must be received before resolution");
  }

  const now = new Date();

  // Prevent double processing 
  const locked = await db
    .update(returns)
    .set({
      status: "processing",
      updatedAt: now,
    })
    .where(
      and(
        eq(returns.id, returnId),
        eq(returns.status, "received")
      )
    )
    .returning();

  if (!locked.length) {
    throw new Error("Return is already being processed");
  }

  try {
    // FINAL DECISION (supports override)
    const finalResolutionType =
      override?.resolutionType ?? returnRecord.resolutionType;

    const finalResponsibility =
      override?.refundResponsibility ?? returnRecord.refundResponsibility;

    let data: any;

    // Execute resolution
    switch (finalResolutionType) {
      case "exchange":
        data = await exchangeResolution(returnRecord);
        break;

      case "refund":
        data = await refundResolution(returnRecord);
        break;

      case "store_credit":
        data = await storeCreditResolution(returnRecord);
        break;

      default:
        throw new Error("Invalid resolution type");
    }

    // Final state update
    await db
      .update(returns)
      .set({
        status: "closed",
        resolutionType: finalResolutionType,
        refundResponsibility: finalResponsibility,
        processedAt: now,
        updatedAt: now,
      })
      .where(eq(returns.id, returnId));

    return {
      message: "Return resolved successfully",
      returnId,
      data,
    };
  } catch (error: any) {
    // rollback to safe state
    await db
      .update(returns)
      .set({
        status: "received",
        updatedAt: now,
      })
      .where(eq(returns.id, returnId));

    throw error;
  }
};


export const getSellerReturnsService = async (sellerId: number) => {
  const rows = await db
    .select({
      returnId: returns.id,
      status: returns.status,
      reason: returns.reason,
      resolutionType: returns.resolutionType,
      refundAmount: returns.refundAmount,
      createdAt: returns.createdAt,

      orderId: orders.id,

      buyerId: users.id,
      buyerName: users.firstname,
      buyerPhone: users.phone,

      productId: products.id,
      productName: products.name,
    })
    .from(returns)
    .innerJoin(orders, eq(returns.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(shops, eq(orderItems.shopId, shops.id))
    .where(eq(shops.sellerId, sellerId));

  // GROUP manually
  const grouped = new Map();

  for (const row of rows) {
    if (!grouped.has(row.returnId)) {
      grouped.set(row.returnId, {
        returnId: row.returnId,
        status: row.status,
        reason: row.reason,
        resolutionType: row.resolutionType,
        refundAmount: row.refundAmount,
        createdAt: row.createdAt,
        orderId: row.orderId,
        buyer: {
          id: row.buyerId,
          name: row.buyerName,
          phone: row.buyerPhone,
        },
        items: [],
      });
    }

    grouped.get(row.returnId).items.push({
      productId: row.productId,
      productName: row.productName,
    });
  }

  return Array.from(grouped.values());
};


export const getReturnsByPickupLocationService = async (user: any) => {
  let condition;

  if (user.role === "station_manager") {
    // station manager 
    const [station] = await db
      .select()
      .from(stations)
      .where(eq(stations.managerId, user.id));

    if (!station) {
      throw new Error("Station not found for this manager");
    }

    condition = eq(orders.pickupStationId, station.id);

  } else if (user.role === "agent") {
    // agent
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, user.id));

    if (!agent) {
      throw new Error("Agent not found");
    }

    condition = eq(orders.pickupAgentId, agent.id);

  } else {
    throw new Error("Unauthorized role");
  }

  const pickupReturns = await db
    .select({
      returnId: returns.id,
      status: returns.status,
      reason: returns.reason,
      resolutionType: returns.resolutionType,
      refundAmount: returns.refundAmount,
      createdAt: returns.createdAt,

      orderId: orders.id,

      pickupStationId: orders.pickupStationId,
      pickupAgentId: orders.pickupAgentId,

      buyerId: users.id,
      buyerName: users.firstname,
      buyerPhone: users.phone,

      productId: products.id,
      productName: products.name,
    })
    .from(returns)
    .innerJoin(orders, eq(returns.orderId, orders.id))
    .innerJoin(users, eq(returns.userId, users.id))
    .innerJoin(orderItems, eq(returns.orderItemId, orderItems.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(condition);

  return pickupReturns;
};


export const getReturnsByOriginStationService = async (user: any) => {
  if (user.role !== "station_manager") {
    throw new Error("Unauthorized role");
  }

  // Get station managed by this user
  const [station] = await db
    .select()
    .from(stations)
    .where(eq(stations.managerId, user.id));

  if (!station) {
    throw new Error("Station not found for this manager");
  }

  const originReturns = await db
    .select({
      returnId: returns.id,
      status: returns.status,
      reason: returns.reason,
      resolutionType: returns.resolutionType,
      refundAmount: returns.refundAmount,
      createdAt: returns.createdAt,

      orderId: orders.id,

      originStationId: orderItems.originStationId,

      buyerId: users.id,
      buyerName: users.firstname,
      buyerPhone: users.phone,

      productId: products.id,
      productName: products.name,
    })
    .from(returns)
    .innerJoin(orders, eq(returns.orderId, orders.id))
    .innerJoin(users, eq(returns.userId, users.id))
    .innerJoin(orderItems, eq(returns.orderItemId, orderItems.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.originStationId, station.id));

  return originReturns;
};

export const getAllReturnsService = async (user: any, query: any) => {
  const { type, status, resolutionType } = query;

  let condition: any;

  //ROLE-BASED BASE FILTER
  if (user.role === "seller") {
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, user.id));

    if (!seller) throw new Error("Seller not found");

    condition = eq(returns.sellerId, seller.id);

  } else if (user.role === "station_manager") {
    const [station] = await db
      .select()
      .from(stations)
      .where(eq(stations.managerId, user.id));

    if (!station) throw new Error("Station not found");

    if (type === "origin") {
      condition = eq(orderItems.originStationId, station.id);
    } else {
      // default → pickup
      condition = eq(orders.pickupStationId, station.id);
    }

  } else if (user.role === "agent") {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, user.id));

    if (!agent) throw new Error("Agent not found");

    condition = eq(orders.pickupAgentId, agent.id);

  } else if (user.role === "admin") {
    condition = undefined; // admin sees all
  } else {
    throw new Error("Unauthorized role");
  }

  const filters: (ReturnType<typeof eq> | ReturnType<typeof and>)[] = [];

  if (condition) filters.push(condition);
  if (status) filters.push(eq(returns.status, status));
  if (resolutionType)
    filters.push(eq(returns.resolutionType, resolutionType));

  const finalCondition =
    filters.length > 0 ? and(...filters) : undefined;

  const data = await db
    .select({
      returnId: returns.id,
      status: returns.status,
      reason: returns.reason,
      resolutionType: returns.resolutionType,
      refundAmount: returns.refundAmount,
      createdAt: returns.createdAt,

      orderId: orders.id,

      sellerId: returns.sellerId,

      pickupStationId: orders.pickupStationId,
      pickupAgentId: orders.pickupAgentId,
      originStationId: orderItems.originStationId,

      buyerId: users.id,
      buyerName: users.firstname,
      buyerPhone: users.phone,

      productId: products.id,
      productName: products.name,
      productImage: productImages.imageUrl,
    })
    .from(returns)
    .innerJoin(orders, eq(returns.orderId, orders.id))
    .innerJoin(users, eq(returns.userId, users.id))
    .innerJoin(orderItems, eq(returns.orderItemId, orderItems.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(
    productImages,
    and(
      eq(productImages.productId, products.id),
      eq(productImages.isMain, true)
    )
    )
    .where(finalCondition);

  return data;
};