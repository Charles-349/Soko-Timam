import db from "../Drizzle/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  sellerWallets,
  sellerWalletTransactions,
  sellers,
} from "../Drizzle/schema";
import { paySellerViaMpesa } from "../payment/payment.service";
import { normalizePhoneNumber } from "../utils/normalizePhoneNumber";

export const getSellerWalletService = async (sellerId: number) => {
  const wallet = await db.query.sellerWallets.findFirst({
    where: eq(sellerWallets.sellerId, sellerId),
  });

  if (!wallet) throw new Error("Seller wallet not found");
  return wallet;
};

export const getSellerWalletTransactionsService = async (sellerId: number) => {
  return await db.query.sellerWalletTransactions.findMany({
    where: eq(sellerWalletTransactions.sellerId, sellerId),
    orderBy: (tx, { desc }) => [desc(tx.createdAt)],
  });
};


// CREDIT
export const creditSellerWalletService = async ({
  sellerId,
  amount,
  orderId,
  productId,
  note = "Order payment",
}: {
  sellerId: number;
  amount: number;
  orderId?: number;
  productId?: number;
  note?: string;
}) => {
  const amountNum = Number(amount);

  await db.update(sellerWallets).set({
    balance: sql`${sellerWallets.balance} + ${amountNum}`,
    totalEarned: sql`${sellerWallets.totalEarned} + ${amountNum}`,
  }).where(eq(sellerWallets.sellerId, sellerId));

  await db.insert(sellerWalletTransactions).values({
    sellerId,
    amount: amountNum.toString(),
    orderId,
    productId,
    type: "credit",
    note,
    walletStatus: "completed",
  });
};

// DEBIT
export const debitSellerWalletService = async ({
  sellerId,
  amount,
  note = "Platform debit",
}: {
  sellerId: number;
  amount: number;
  note?: string;
}) => {
  const wallet = await getSellerWalletService(sellerId);
  if (Number(wallet.balance) < amount) throw new Error("Insufficient balance");

  await db.update(sellerWallets).set({
    balance: sql`${sellerWallets.balance} - ${amount}`,
  }).where(eq(sellerWallets.sellerId, sellerId));

  await db.insert(sellerWalletTransactions).values({
    sellerId,
    amount: amount.toString(),
    type: "debit",
    note,
    walletStatus: "completed",
  });
};

// SELLER REQUESTS WITHDRAWAL
export const requestWithdrawalService = async (sellerId: number, amount: number) => {
  const wallet = await getSellerWalletService(sellerId);
  if (Number(wallet.balance) < amount) throw new Error("Insufficient balance");

  await db.update(sellerWallets).set({
    balance: sql`${sellerWallets.balance} - ${amount}`,
    pendingWithdrawal: sql`${sellerWallets.pendingWithdrawal} + ${amount}`,
  }).where(eq(sellerWallets.sellerId, sellerId));

  const [tx] = await db.insert(sellerWalletTransactions).values({
    sellerId,
    amount: amount.toString(),
    type: "withdrawal",
    note: "Withdrawal request",
    walletStatus: "pending",
    createdAt: new Date(),
  }).returning();

  return tx;
};

// ADMIN COMPLETES WITHDRAWAL
export const completeWithdrawalService = async (transactionId: number) => {
  const withdrawal: any = await db.query.sellerWalletTransactions.findFirst({
    where: eq(sellerWalletTransactions.id, transactionId),
  });

  if (!withdrawal || withdrawal.type !== "withdrawal")
    throw new Error("Withdrawal request not found");

  if (withdrawal.walletStatus !== "pending")
    throw new Error("Withdrawal already processed");

  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.id, withdrawal.sellerId),
  });

  if (!seller) throw new Error("Seller not found");

  try {
    const phone = normalizePhoneNumber(seller.phone);

    const mpesaResult = await paySellerViaMpesa(
      phone,
      Number(withdrawal.amount)
    );

    // Mark as processing, not completed
    await db.update(sellerWalletTransactions).set({
      walletStatus: "processing",
      updatedAt: new Date(),
    }).where(eq(sellerWalletTransactions.id, transactionId));

    return { success: true, mpesaResult };
  } catch (err) {
    // Refund seller
    await db.update(sellerWallets).set({
      balance: sql`${sellerWallets.balance} + ${withdrawal.amount}`,
      pendingWithdrawal: sql`${sellerWallets.pendingWithdrawal} - ${withdrawal.amount}`,
    }).where(eq(sellerWallets.sellerId, withdrawal.sellerId));

    await db.update(sellerWalletTransactions).set({
      walletStatus: "failed",
    }).where(eq(sellerWalletTransactions.id, transactionId));

    throw err;
  }
};



// Auto payout service
const MIN_PAYOUT_AMOUNT = 1000; 


export const autoPayoutService = async () => {
  try {
    // Get all sellers with balance > MIN_PAYOUT_AMOUNT
    const eligibleWallets = await db.query.sellerWallets.findMany({
      where: sql`${sellerWallets.balance} >= ${MIN_PAYOUT_AMOUNT}`,
    });

    for (const wallet of eligibleWallets) {
      try {
        console.log(`Processing auto-payout for sellerId: ${wallet.sellerId}`);

        //Request Withdrawal
        const tx = await requestWithdrawalService(
          wallet.sellerId,
          Number(wallet.balance)
        );

        //Complete Withdrawal (trigger B2C)
        const result = await completeWithdrawalService(tx.id);
        console.log(`Auto-payout success for sellerId ${wallet.sellerId}`, result.mpesaResult);
      } catch (err: any) {
        console.error(`Auto-payout failed for sellerId ${wallet.sellerId}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("Auto-payout job failed:", err.message);
  }
};
