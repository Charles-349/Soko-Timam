import db from "../Drizzle/db";
import { eq, sql, and } from "drizzle-orm";
import {
  returns,
  refunds,
  orders,
  orderItems,
  shops,
  sellers,
} from "../Drizzle/schema";
import {
  debitSellerWalletService,
  creditSellerWalletService,
} from "../wallet/wallet.service";
import { paySellerViaMpesa } from "../payment/payment.service";

// CREATE RETURN REQUEST
type ReturnRow = {
  id: number;
  status: "requested" | "approved" | "rejected" | "received" | "refunded" | "exchanged" | "closed" | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: number;
  sellerId: number;
  orderId: number;
  quantity: number;
  orderItemId: number;
  reason: string;
  resolutionType: string | null;
  refundAmount: string | null;
  customerNote: string | null;
  adminNote: string | null;
  evidenceUrl: string | null;
  processedAt: Date | null;
};

export const createReturnService = async ({
  orderItemIds,
  reason,
}: {
  orderItemIds: number[];
  reason: string;
}): Promise<ReturnRow[]> => {
  if (!orderItemIds?.length) throw new Error("No order items specified");

  const returnRecords: ReturnRow[] = [];
  const affectedOrderIds = new Set<number>();

  for (const itemId of orderItemIds) {
    const [orderItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, itemId));

    if (!orderItem) throw new Error(`Order item ${itemId} not found`);

    const [existingReturn] = await db
      .select()
      .from(returns)
      .where(eq(returns.orderItemId, itemId));

    if (existingReturn)
      throw new Error(`Return already exists for order item ${itemId}`);

    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, orderItem.shopId));

    if (!shop)
      throw new Error(`Shop not found for order item ${itemId}`);

    const sellerId = shop.sellerId;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderItem.orderId));

    const userId = order?.userId ?? 0;

    const [returnRecord] = await db
      .insert(returns)
      .values({
        orderItemId: itemId,
        orderId: orderItem.orderId,
        sellerId,
        userId,
        reason,
        refundAmount: sql`${Number(orderItem.price) * Number(orderItem.quantity)}`,
        status: "requested",
      })
      .returning();

    returnRecords.push(returnRecord);
    affectedOrderIds.add(orderItem.orderId);
  }

  //LOCK ESCROW FOR AFFECTED ORDERS
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

// PROCESS RETURN REFUNDS
export const processReturnRefundService = async (
  returnIds: number[]
) => {
  if (!returnIds.length)
    throw new Error("No return IDs provided");

  const results: Array<{
    returnId: number;
    success: boolean;
    refundRecord?: any;
    payoutResult?: any;
    error?: string;
  }> = [];

  for (const returnId of returnIds) {
    const [returnRecord] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId));

    if (!returnRecord)
      throw new Error(`Return ID ${returnId} not found`);

    if (
      !returnRecord.refundAmount ||
      Number(returnRecord.refundAmount) <= 0
    )
      throw new Error(
        `No refundable amount for return ID ${returnId}`
      );

    const sellerId = returnRecord.sellerId;
    const refundAmount = Number(returnRecord.refundAmount);

    const [refundRecord] = await db
      .insert(refunds)
      .values({
        returnId,
        amount: refundAmount.toFixed(2),
        status: "pending",
        attempts: 0,
        createdAt: new Date(),
      })
      .returning();

    try {
      //Debit seller escrow balance
      await debitSellerWalletService({
        sellerId,
        amount: refundAmount,
        note: `Refund for return ID ${returnId}`,
      });

      //Get seller phone
      const [seller] = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, sellerId));

      const phone = seller?.phone || "";

      //Payout via M-Pesa
      const payoutResult = await paySellerViaMpesa(
        refundRecord.id,
        phone,
        refundAmount
      );

      //Update refund record
      await db
        .update(refunds)
        .set({
          status: "completed",
          externalTransactionId:
            payoutResult.externalTransactionId,
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      //Update return status
      await db
        .update(returns)
        .set({
          status: "refunded",
          processedAt: new Date(),
        })
        .where(eq(returns.id, returnId));

      //Reduce locked escrow amount
      await db
        .update(orders)
        .set({
          escrowLockedAmount: sql`
            ${orders.escrowLockedAmount} - ${refundAmount}
          `,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, returnRecord.orderId));

      //Check if fully unlocked
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, returnRecord.orderId));

      if (Number(order.escrowLockedAmount) <= 0) {
        await db
          .update(orders)
          .set({
            isEscrowLocked: false,
            escrowLockedAmount: "0",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }

      results.push({
        returnId,
        success: true,
        refundRecord,
        payoutResult,
      });
    } catch (err: any) {
      //Rollback escrow debit if payout fails
      await creditSellerWalletService({
        sellerId,
        amount: refundAmount,
        note: `Refund rollback for return ID ${returnId}`,
      });

      await db
        .update(refunds)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      results.push({
        returnId,
        success: false,
        error: err.message,
      });
    }
  }

  return results;
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