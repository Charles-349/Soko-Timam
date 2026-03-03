import db from "../Drizzle/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  sellerWallets,
  sellerWalletTransactions,
  sellers,
} from "../Drizzle/schema";
import { paySellerViaMpesa } from "../payment/payment.service";
import { normalizePhoneNumber } from "../utils/normalizePhoneNumber";

//GET WALLET
export const getSellerWalletService = async (sellerId: number) => {
  const wallet = await db.query.sellerWallets.findFirst({
    where: eq(sellerWallets.sellerId, sellerId),
  });

  if (!wallet) throw new Error("Seller wallet not found");
  return wallet;
};

//GET WALLET TRANSACTIONS
export const getSellerWalletTransactionsService = async (
  sellerId: number
) => {
  return await db.query.sellerWalletTransactions.findMany({
    where: eq(sellerWalletTransactions.sellerId, sellerId),
    orderBy: (tx, { desc }) => [desc(tx.createdAt)],
  });
};

//CREDIT
export const creditSellerWalletService = async ({
  sellerId,
  amount,
  orderId,
  note = "Order payment (escrow)",
}: {
  sellerId: number;
  amount: number;
  orderId?: number;
  note?: string;
}) => {
  const amountNum = Number(amount);

  await db.update(sellerWallets).set({
    pendingBalance: sql`${sellerWallets.pendingBalance} + ${amountNum}`,
    totalEarned: sql`${sellerWallets.totalEarned} + ${amountNum}`,
  }).where(eq(sellerWallets.sellerId, sellerId));

  await db.insert(sellerWalletTransactions).values({
    sellerId,
    amount: amountNum.toString(),
    orderId,
    type: "credit",
    note,
    walletStatus: "completed",
    createdAt: new Date(),
  });
};

export const releaseEscrowToAvailableService = async (
  sellerId: number,
  amount: number,
  note = "Escrow settlement release"
) => {
  const wallet = await getSellerWalletService(sellerId);

  if (Number(wallet.pendingBalance) < amount)
    throw new Error("Insufficient pending balance");

  await db.update(sellerWallets).set({
    pendingBalance: sql`${sellerWallets.pendingBalance} - ${amount}`,
    availableBalance: sql`${sellerWallets.availableBalance} + ${amount}`,
  }).where(eq(sellerWallets.sellerId, sellerId));

  await db.insert(sellerWalletTransactions).values({
    sellerId,
    amount: amount.toString(),
    type: "credit",
    note,
    walletStatus: "completed",
    createdAt: new Date(),
  });
};

//DEBIT FOR REFUND
export const debitSellerWalletService = async ({
  sellerId,
  amount,
  note = "Refund debit",
}: {
  sellerId: number;
  amount: number;
  note?: string;
}) => {
  const wallet = await getSellerWalletService(sellerId);

  const pending = Number(wallet.pendingBalance);
  const available = Number(wallet.availableBalance);

  if (pending >= amount) {
    await db.update(sellerWallets).set({
      pendingBalance: sql`${sellerWallets.pendingBalance} - ${amount}`,
    }).where(eq(sellerWallets.sellerId, sellerId));
  } else if (available >= amount) {
    await db.update(sellerWallets).set({
      availableBalance: sql`${sellerWallets.availableBalance} - ${amount}`,
    }).where(eq(sellerWallets.sellerId, sellerId));
  } else {
    throw new Error("Insufficient funds for refund");
  }

  await db.insert(sellerWalletTransactions).values({
    sellerId,
    amount: amount.toString(),
    type: "debit",
    note,
    walletStatus: "completed",
    createdAt: new Date(),
  });
};

//SELLER REQUEST WITHDRAWAL
export const requestWithdrawalService = async (
  sellerId: number,
  amount: number
) => {
  const wallet = await getSellerWalletService(sellerId);

  if (Number(wallet.availableBalance) < amount)
    throw new Error("Insufficient available balance");

  await db.update(sellerWallets).set({
    availableBalance: sql`${sellerWallets.availableBalance} - ${amount}`,
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

//  ADMIN COMPLETE WITHDRAWAL (M-Pesa B2C)
export const completeWithdrawalService = async (
  transactionId: number
) => {
  const withdrawal = await db.query.sellerWalletTransactions.findFirst({
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
      transactionId,
      phone,
      Number(withdrawal.amount)
    );

    await db.update(sellerWalletTransactions).set({
      walletStatus: "completed",
      updatedAt: new Date(),
    }).where(eq(sellerWalletTransactions.id, transactionId));

    await db.update(sellerWallets).set({
      totalWithdrawn: sql`${sellerWallets.totalWithdrawn} + ${withdrawal.amount}`,
    }).where(eq(sellerWallets.sellerId, withdrawal.sellerId));

    return { success: true, mpesaResult };
  } catch (err) {
    // rollback
    await db.update(sellerWallets).set({
      availableBalance: sql`${sellerWallets.availableBalance} + ${withdrawal.amount}`,
    }).where(eq(sellerWallets.sellerId, withdrawal.sellerId));

    await db.update(sellerWalletTransactions).set({
      walletStatus: "failed",
    }).where(eq(sellerWalletTransactions.id, transactionId));

    throw err;
  }
};

//GET TRANSACTIONS BY WALLET ID
export const getWalletTransactionsByWalletIdService = async (
  walletId: number
) => {
  const wallet = await db.query.sellerWallets.findFirst({
    where: eq(sellerWallets.id, walletId),
  });

  if (!wallet) throw new Error("Wallet not found");

  return await db.query.sellerWalletTransactions.findMany({
    where: eq(sellerWalletTransactions.sellerId, wallet.sellerId),
    orderBy: (tx, { desc }) => [desc(tx.createdAt)],
  });
};

// GET PENDING WITHDRAWAL REQUESTS (Admin)
export const getPendingWithdrawalRequestsService = async () => {
  return await db
    .select({
      transactionId: sellerWalletTransactions.id,
      externalTransactionId: sellerWalletTransactions.externalTransactionId,
      amount: sellerWalletTransactions.amount,
      note: sellerWalletTransactions.note,
      walletStatus: sellerWalletTransactions.walletStatus,
      sellerId: sellerWalletTransactions.sellerId,
      sellerName: sellers.fullname,
      sellerEmail: sellers.email,
      sellerPhone: sellers.phone,
      createdAt: sellerWalletTransactions.createdAt,
    })
    .from(sellerWalletTransactions)
    .leftJoin(
      sellers,
      eq(sellers.id, sellerWalletTransactions.sellerId)
    )
    .where(
      and(
        eq(sellerWalletTransactions.type, "withdrawal"),
        eq(sellerWalletTransactions.walletStatus, "pending")
      )
    )
    .orderBy(desc(sellerWalletTransactions.createdAt));
};