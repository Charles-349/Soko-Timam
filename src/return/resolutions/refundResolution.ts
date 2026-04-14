// import { eq, sql } from "drizzle-orm";
// import db from "../../Drizzle/db";
// import { refunds, returns, sellers, orders } from "../../Drizzle/schema";
// import { debitSellerWalletService, creditSellerWalletService } from "../../wallet/wallet.service";
// import { paySellerViaMpesa } from "../../payment/payment.service";

// export const refundResolution = async (returnRecord: any) => {
//   const refundAmount = Number(returnRecord.refundAmount);

//   if (!refundAmount || refundAmount <= 0)
//     throw new Error(`No refundable amount for return ${returnRecord.id}`);

//   const sellerId = returnRecord.sellerId;

//   const [refundRecord] = await db
//     .insert(refunds)
//     .values({
//       returnId: returnRecord.id,
//       amount: refundAmount.toFixed(2),
//       status: "pending",
//       attempts: 0,
//       createdAt: new Date(),
//     })
//     .returning();

//   try {
//     // Debit seller wallet
//     await debitSellerWalletService({
//       sellerId,
//       amount: refundAmount,
//       note: `Refund for return ID ${returnRecord.id}`,
//     });

//     // Payout via M-Pesa
//     const [seller] = await db
//       .select()
//       .from(sellers)
//       .where(eq(sellers.id, sellerId));

//     const phone = seller?.phone || "";

//     const payoutResult = await paySellerViaMpesa(
//       refundRecord.id,
//       phone,
//       refundAmount
//     );

//     // Update refund
//     await db
//       .update(refunds)
//       .set({
//         status: "completed",
//         externalTransactionId: payoutResult.externalTransactionId,
//         updatedAt: new Date(),
//       })
//       .where(eq(refunds.id, refundRecord.id));

    // // Update return
    // await db
    //   .update(returns)
    //   .set({
    //     status: "refunded",
    //     processedAt: new Date(),
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(returns.id, returnRecord.id));

//     await db
//       .update(returns)
//       .set({
//        status: "closed",
//        processedAt: new Date(),
//        updatedAt: new Date(),
//        })
//       .where(eq(returns.id, returnRecord.id));

//     // Reduce escrow
//     await db
//       .update(orders)
//       .set({
//         escrowLockedAmount: sql`${orders.escrowLockedAmount} - ${refundAmount}`,
//         updatedAt: new Date(),
//       })
//       .where(eq(orders.id, returnRecord.orderId));

//     const [order] = await db
//       .select()
//       .from(orders)
//       .where(eq(orders.id, returnRecord.orderId));

//     if (Number(order.escrowLockedAmount) <= 0) {
//       await db
//         .update(orders)
//         .set({
//           isEscrowLocked: false,
//           escrowLockedAmount: "0",
//           updatedAt: new Date(),
//         })
//         .where(eq(orders.id, order.id));
//     }

//     return { refundRecord, payoutResult };

//   } catch (err: any) {
//     // Rollback if payout fails
//     await creditSellerWalletService({
//       sellerId,
//       amount: refundAmount,
//       note: `Refund rollback for return ID ${returnRecord.id}`,
//     });

//     await db
//       .update(refunds)
//       .set({
//         status: "failed",
//         updatedAt: new Date(),
//       })
//       .where(eq(refunds.id, refundRecord.id));

//     throw new Error(err.message);
//   }
// };



import { eq, sql } from "drizzle-orm";
import db from "../../Drizzle/db";
import { refunds, returns, orders, users } from "../../Drizzle/schema";
import { payCustomerRefundViaMpesa } from "../../payment/payment.service";

export const refundResolution = async (returnRecord: any) => {
  const refundAmount = Number(returnRecord.refundAmount);

  if (!refundAmount || refundAmount <= 0) {
    throw new Error(`No refundable amount for return ${returnRecord.id}`);
  }

  // Create refund record
  const [refundRecord] = await db
    .insert(refunds)
    .values({
      returnId: returnRecord.id,
      amount: refundAmount.toFixed(2),
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
    })
    .returning();

  try {
    //Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, returnRecord.orderId));

    if (!order) {
      throw new Error("Order not found");
    }

    //Get customer 
    const [customer] = await db
      .select()
      .from(users)
      .where(eq(users.id, order.userId));

    if (!customer) {
      throw new Error("Customer not found");
    }

    const phone = customer.phone || "";

    if (!phone) {
      throw new Error("Customer phone number is missing");
    }

    //Mark return as processing
    await db.update(returns)
      .set({
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnRecord.id));

    //Pay CUSTOMER refund via M-Pesa
    const payoutResult = await payCustomerRefundViaMpesa(
      returnRecord.id,
      phone,
      refundAmount
    );

    //Update refund record
    await db.update(refunds)
      .set({
        status: "completed",
        externalTransactionId: payoutResult.externalTransactionId,
        updatedAt: new Date(),
      })
      .where(eq(refunds.id, refundRecord.id));

      // Update return
    await db
      .update(returns)
      .set({
        status: "refunded",
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnRecord.id));

    //Close return
    await db.update(returns)
      .set({
        status: "closed",
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(returns.id, returnRecord.id));

    //Reduce escrow from order
    await db.update(orders)
      .set({
        escrowLockedAmount: sql`${orders.escrowLockedAmount} - ${refundAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, returnRecord.orderId));

    //Unfreeze escrow 
    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, returnRecord.orderId));

    if (updatedOrder && Number(updatedOrder.escrowLockedAmount) <= 0) {
      await db.update(orders)
        .set({
          isEscrowLocked: false,
          escrowLockedAmount: "0",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, updatedOrder.id));
    }

    return {
      refundRecord,
      payoutResult,
    };
  } catch (err: any) {
    // rollback refund record
    await db.update(refunds)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(refunds.id, refundRecord.id));

    throw new Error(err.message);
  }
};