import db from "../Drizzle/db";
import { eq, lte, and, sql } from "drizzle-orm";
import {
  orders,
  orderItems,
  shops,
  sellerWallets,
  sellerWalletTransactions,
} from "../Drizzle/schema";

export const releaseEscrowSettlementsService = async () => {
  console.log("Running escrow settlement job...");

  const now = new Date();

  const eligibleOrders = await db.query.orders.findMany({
    where: and(
      lte(orders.escrowReleaseAt, now),
      eq(orders.status, "paid")
    ),
  });

  for (const order of eligibleOrders) {
    try {
      const totalAmount = Number(order.totalAmount);
      const lockedAmount = Number(order.escrowLockedAmount || 0);
      const releasedAmount = Number(order.escrowReleasedAmount || 0);

      const releasableAmount =
        totalAmount - lockedAmount - releasedAmount;

      if (releasableAmount <= 0) {
        continue;
      }

      //Calculate earnings per seller
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, order.id),
      });

      const earningsBySeller: Record<number, number> = {};
      let totalItemsAmount = 0;

      for (const item of items) {
        const shop = await db.query.shops.findFirst({
          where: eq(shops.id, item.shopId),
        });
        if (!shop) continue;

        const sellerId = shop.sellerId;
        const itemAmount =
          Number(item.price) * Number(item.quantity);

        totalItemsAmount += itemAmount;

        if (!earningsBySeller[sellerId])
          earningsBySeller[sellerId] = 0;

        earningsBySeller[sellerId] += itemAmount;
      }

      //Distribute proportionally
      for (const sellerIdStr of Object.keys(earningsBySeller)) {
        const sellerId = Number(sellerIdStr);
        const sellerTotal = earningsBySeller[sellerId];

        const proportionalRelease =
          (sellerTotal / totalItemsAmount) *
          releasableAmount;

        const amount = Number(proportionalRelease.toFixed(2));

        if (amount <= 0) continue;

        await db.update(sellerWallets).set({
          pendingBalance: sql`${sellerWallets.pendingBalance} - ${amount}`,
          balance: sql`${sellerWallets.balance} + ${amount}`,
        }).where(eq(sellerWallets.sellerId, sellerId));

        await db.insert(sellerWalletTransactions).values({
          sellerId,
          orderId: order.id,
          amount: amount.toFixed(2),
          type: "settlement",
          note: `Partial escrow release for order ${order.id}`,
          walletStatus: "completed",
          createdAt: new Date(),
        });
      }

      //Update released amount
      await db.update(orders).set({
        escrowReleasedAmount: sql`
          ${orders.escrowReleasedAmount} + ${releasableAmount}
        `,
        updatedAt: new Date(),
      }).where(eq(orders.id, order.id));

      //If fully released → mark final
      if (lockedAmount === 0 &&
          totalAmount <= releasedAmount + releasableAmount) {
        await db.update(orders).set({
          isEscrowReleased: true,
        }).where(eq(orders.id, order.id));
      }

      console.log(
        `Escrow partially released for order ${order.id}: ${releasableAmount}`
      );

    } catch (err) {
      console.error(
        "Settlement error for order:",
        order.id,
        err
      );
    }
  }

  console.log("Escrow settlement job completed.");
};