import db from "../Drizzle/db";
import { eq, sql, and } from "drizzle-orm";
import {
  returns,
  refunds,
  orders,
  orderItems,
  shops,
  sellers,
  shipping,
} from "../Drizzle/schema";
import {
  debitSellerWalletService,
  creditSellerWalletService,
} from "../wallet/wallet.service";
import { paySellerViaMpesa } from "../payment/payment.service";
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

export const reviewReturnService = async ({
  returnId,
  action, 
  resolutionType, 
  refundResponsibility, 
  adminNote,
}: {
  returnId: number;
  action: "approve" | "reject";
  resolutionType?: string;
  refundResponsibility?: string;
  adminNote?: string;
}) => {
  const [returnRecord] = await db
    .select()
    .from(returns)
    .where(eq(returns.id, returnId));

  if (!returnRecord) throw new Error("Return not found");

  if (returnRecord.status !== "requested")
    throw new Error("Return already processed");

  if (action === "reject") {
    await db
      .update(returns)
      .set({
        status: "rejected",
        adminNote,
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnId));

    // Unlock escrow immediately if rejected
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
  if (!resolutionType)
    throw new Error("Resolution type required for approval");

  const refundAmount = Number(returnRecord.refundAmount || 0);

  // Increase locked escrow amount
  await db
    .update(orders)
    .set({
      escrowLockedAmount: sql`
        ${orders.escrowLockedAmount} + ${refundAmount}
      `,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, returnRecord.orderId));

  await db
    .update(returns)
    .set({
      status: "approved",
      resolutionType: resolutionType as "refund" | "exchange" | "store_credit",
      refundResponsibility,
      adminNote,
      updatedAt: new Date(),
    })
    .where(eq(returns.id, returnId));

  return { message: "Return approved" };
};

// PROCESS RETURN REFUNDS
// export const processReturnRefundService = async (
//   returnIds: number[]
// ) => {
//   if (!returnIds.length)
//     throw new Error("No return IDs provided");

//   const results: Array<{
//     returnId: number;
//     success: boolean;
//     refundRecord?: any;
//     payoutResult?: any;
//     error?: string;
//   }> = [];

//   for (const returnId of returnIds) {
//     const [returnRecord] = await db
//       .select()
//       .from(returns)
//       .where(eq(returns.id, returnId));

//     if (!returnRecord)
//       throw new Error(`Return ID ${returnId} not found`);

//     if (
//       !returnRecord.refundAmount ||
//       Number(returnRecord.refundAmount) <= 0
//     )
//       throw new Error(
//         `No refundable amount for return ID ${returnId}`
//       );

//     if (returnRecord.status !== "approved")
//       throw new Error(
//         `Return ID ${returnId} is not approved for refund`
//       );
//     const sellerId = returnRecord.sellerId;
//     const refundAmount = Number(returnRecord.refundAmount);
    
//     const [refundRecord] = await db
//       .insert(refunds)
//       .values({
//         returnId,
//         amount: refundAmount.toFixed(2),
//         status: "pending",
//         attempts: 0,
//         createdAt: new Date(),
//       })
//       .returning();

//     try {
//       //Debit seller escrow balance
//       await debitSellerWalletService({
//         sellerId,
//         amount: refundAmount,
//         note: `Refund for return ID ${returnId}`,
//       });

//       //Get seller phone
//       const [seller] = await db
//         .select()
//         .from(sellers)
//         .where(eq(sellers.id, sellerId));

//       const phone = seller?.phone || "";

//       //Payout via M-Pesa
//       const payoutResult = await paySellerViaMpesa(
//         refundRecord.id,
//         phone,
//         refundAmount
//       );

//       //Update refund record
//       await db
//         .update(refunds)
//         .set({
//           status: "completed",
//           externalTransactionId:
//             payoutResult.externalTransactionId,
//           updatedAt: new Date(),
//         })
//         .where(eq(refunds.id, refundRecord.id));

//       //Update return status
//       await db
//         .update(returns)
//         .set({
//           status: "refunded",
//           processedAt: new Date(),
//         })
//         .where(eq(returns.id, returnId));

//       //Reduce locked escrow amount
//       await db
//         .update(orders)
//         .set({
//           escrowLockedAmount: sql`
//             ${orders.escrowLockedAmount} - ${refundAmount}
//           `,
//           updatedAt: new Date(),
//         })
//         .where(eq(orders.id, returnRecord.orderId));

//       //Check if fully unlocked
//       const [order] = await db
//         .select()
//         .from(orders)
//         .where(eq(orders.id, returnRecord.orderId));

//       if (Number(order.escrowLockedAmount) <= 0) {
//         await db
//           .update(orders)
//           .set({
//             isEscrowLocked: false,
//             escrowLockedAmount: "0",
//             updatedAt: new Date(),
//           })
//           .where(eq(orders.id, order.id));
//       }

//       results.push({
//         returnId,
//         success: true,
//         refundRecord,
//         payoutResult,
//       });
//     } catch (err: any) {
//       //Rollback escrow debit if payout fails
//       await creditSellerWalletService({
//         sellerId,
//         amount: refundAmount,
//         note: `Refund rollback for return ID ${returnId}`,
//       });

//       await db
//         .update(refunds)
//         .set({
//           status: "failed",
//           updatedAt: new Date(),
//         })
//         .where(eq(refunds.id, refundRecord.id));

//       results.push({
//         returnId,
//         success: false,
//         error: err.message,
//       });
//     }
//   }

//   return results;
// };

export const processReturnRefundService = async (returnIds: number[]) => {
  if (!returnIds.length) throw new Error("No return IDs provided");

  // Use the unified resolver 
  return processBulkReturns(returnIds, resolveReturn);
};

//PROCESS EXCHANGE
// export const processReturnExchangeService = async (
//   returnIds: number[]
// ) => {

//   if (!returnIds.length)
//     throw new Error("No return IDs provided");

//   const results: Array<{
//     returnId: number;
//     success: boolean;
//     replacementItem?: any;
//     error?: string;
//   }> = [];

//   for (const returnId of returnIds) {

//     try {

//       const [returnRecord] = await db
//         .select()
//         .from(returns)
//         .where(eq(returns.id, returnId));

//       if (!returnRecord)
//         throw new Error(`Return ID ${returnId} not found`);

//       if (returnRecord.status !== "approved")
//         throw new Error(`Return ID ${returnId} must be approved first`);

//       if (returnRecord.resolutionType !== "exchange")
//         throw new Error(`Return ID ${returnId} is not exchange`);

//       const [originalItem] = await db
//         .select()
//         .from(orderItems)
//         .where(eq(orderItems.id, returnRecord.orderItemId));

//       if (!originalItem)
//         throw new Error(`Original order item not found for return ${returnId}`);

//       const replacementItem = (await db
//         .insert(orderItems)
//         .values({
//           orderId: originalItem.orderId,
//           productId: originalItem.productId,
//           quantity: returnRecord.quantity,
//           price: originalItem.price,
//           shopId: originalItem.shopId,
//           replacementForReturnId: returnId,
//         })
//         .returning())[0];

//       const [shippingRecord] = await db
//         .insert(shipping)
//         .values({
//           orderId: originalItem.orderId,
//           type: "replacement",
//           status: "preparing",
//           createdAt: new Date(),
//         })
//         .returning();

//       await db
//         .update(returns)
//         .set({
//           status: "exchanged",
//           processedAt: new Date(),
//           replacementShipmentId: shippingRecord.id,
//           updatedAt: new Date(),
//         })
//         .where(eq(returns.id, returnId));

//       results.push({
//         returnId,
//         success: true,
//         replacementItem,
//       });

//     } catch (err: any) {

//       results.push({
//         returnId,
//         success: false,
//         error: err.message,
//       });

//     }
//   }

//   return results;
// };

export const processReturnExchangeService = async (returnIds: number[]) => {
  if (!returnIds.length) throw new Error("No return IDs provided");

  // Use the unified resolver 
  return processBulkReturns(returnIds, resolveReturn);
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