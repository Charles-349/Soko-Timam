import db from "../Drizzle/db";
import { eq, sql, and } from "drizzle-orm";
import {
  returns,
  refunds,
  orders,
  orderItems,
  shops,
  shipping,
} from "../Drizzle/schema";

import { processBulkReturns } from "./processors/bulkReturnProcessor";
import { resolveReturn } from "./resolutions/resolveReturn";

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
  if (returnRecord.status !== "requested") throw new Error("Return already processed");

  // REJECT FLOW
  if (action === "reject") {
    await db
      .update(returns)
      .set({
        status: "rejected",
        adminNote,
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnId));

    await db
      .update(orders)
      .set({
        isEscrowLocked: false,
        escrowLockedAmount: "0",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, returnRecord.orderId));

    return { message: "Return rejected" };
  }

  // APPROVE FLOW
  if (!resolutionType) throw new Error("Resolution type required for approval");

  await db
    .update(returns)
    .set({
      status: "approved",
      resolutionType,
      refundResponsibility,
      adminNote,
      updatedAt: new Date(),
    })
    .where(eq(returns.id, returnId));

  // REFRESH RETURN
  const [updatedReturn] = await db
    .select()
    .from(returns)
    .where(eq(returns.id, returnId));

  if (!updatedReturn || updatedReturn.status !== "approved") {
    throw new Error("Return not properly approved");
  }

  // PROCESS RETURN RESOLUTION
  let result;
  switch (resolutionType) {
    case "exchange":
      result = await processReturnExchangeService([returnId]);
      break;
    case "refund":
      result = await processReturnRefundService([returnId]);
      break;
    case "store_credit":
      result = await processReturnRefundService([returnId]); 
      break;
    default:
      throw new Error("Unsupported resolution type");
  }

  if (!result?.[0]?.success) {
    throw new Error(result?.[0]?.error || "Return processing failed");
  }

  return { message: "Return approved and processed" };
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
export const getReturnsService = async (filters?: { status?: ReturnRow["status"]; sellerId?: number }) => {
  const conditions: (ReturnType<typeof eq> | ReturnType<typeof and>)[] = [];
  if (filters?.status) conditions.push(eq(returns.status, filters.status));
  if (filters?.sellerId) conditions.push(eq(returns.sellerId, filters.sellerId));

  return await db.query.returns.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { orderItem: true },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
};

//GET SINGLE RETURN WITH REFUNDS
export const getReturnByIdService = async (returnId: number) => {
  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.id, returnId),
    with: { orderItem: true },
  });
  if (!returnRecord) throw new Error("Return not found");

  const refundRecords = await db.select().from(refunds).where(eq(refunds.returnId, returnId));

  return { ...returnRecord, refunds: refundRecords };
};