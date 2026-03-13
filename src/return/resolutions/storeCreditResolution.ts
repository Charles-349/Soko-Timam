import { eq, sql } from "drizzle-orm";
import db from "../../Drizzle/db";
import { returns, orders } from "../../Drizzle/schema";
import { debitSellerWalletService } from "../../wallet/wallet.service";

export const storeCreditResolution = async (returnRecord: any) => {
  const refundAmount = Number(returnRecord.refundAmount);

  if (!refundAmount || refundAmount <= 0)
    throw new Error(`No creditable amount for return ${returnRecord.id}`);

  const sellerId = returnRecord.sellerId;

  // Debit seller wallet (escrow)
  await debitSellerWalletService({
    sellerId,
    amount: refundAmount,
    note: `Store credit issued for return ID ${returnRecord.id}`,
  });

  // Update return
  await db
    .update(returns)
    .set({
      status: "credited",
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(returns.id, returnRecord.id));

  // Reduce escrow
  await db
    .update(orders)
    .set({
      escrowLockedAmount: sql`${orders.escrowLockedAmount} - ${refundAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, returnRecord.orderId));

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

  return {
    message: "Store credit issued",
    amount: refundAmount,
  };
};