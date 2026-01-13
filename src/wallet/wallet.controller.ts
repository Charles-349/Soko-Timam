import { Request, Response } from "express";
import {
  getSellerWalletService,
  getSellerWalletTransactionsService,
  creditSellerWalletService,
  debitSellerWalletService,
  requestWithdrawalService,
  completeWithdrawalService,
} from "./wallet.service";

// Get Seller Wallet
export const getSellerWalletController = async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.sellerId);

    if (isNaN(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const wallet = await getSellerWalletService(sellerId);

    return res.status(200).json({
      message: "Seller wallet retrieved successfully",
      wallet,
    });
  } catch (error: any) {
    console.error("Get Seller Wallet Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get Seller Wallet Transactions
export const getSellerWalletTransactionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const sellerId = parseInt(req.params.sellerId);

    if (isNaN(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const transactions = await getSellerWalletTransactionsService(sellerId);

    return res.status(200).json({
      message: "Seller wallet transactions retrieved successfully",
      transactions,
    });
  } catch (error: any) {
    console.error("Get Seller Wallet Transactions Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Credit Seller Wallet
export const creditSellerWalletController = async (
  req: Request,
  res: Response
) => {
  try {
    const { sellerId, amount } = req.body;

    if (!sellerId || !amount) {
      return res
        .status(400)
        .json({ message: "Seller ID and amount are required" });
    }

    await creditSellerWalletService(req.body);

    return res.status(200).json({
      message: "Seller wallet credited successfully",
    });
  } catch (error: any) {
    console.error("Credit Seller Wallet Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Debit Seller Wallet
export const debitSellerWalletController = async (
  req: Request,
  res: Response
) => {
  try {
    const { sellerId, amount } = req.body;

    if (!sellerId || !amount) {
      return res
        .status(400)
        .json({ message: "Seller ID and amount are required" });
    }

    await debitSellerWalletService(req.body);

    return res.status(200).json({
      message: "Seller wallet debited successfully",
    });
  } catch (error: any) {
    console.error("Debit Seller Wallet Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Seller Requests Withdrawal
export const requestWithdrawalController = async (
  req: Request,
  res: Response
) => {
  try {
    const { sellerId, amount } = req.body;

    if (!sellerId || !amount) {
      return res
        .status(400)
        .json({ message: "Seller ID and amount are required" });
    }

    const transaction = await requestWithdrawalService(
      Number(sellerId),
      Number(amount)
    );

    return res.status(200).json({
      message: "Withdrawal request submitted successfully",
      transaction,
    });
  } catch (error: any) {
    console.error("Withdrawal Request Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Admin Completes Withdrawal (Triggers M-Pesa B2C)
export const completeWithdrawalController = async (
  req: Request,
  res: Response
) => {
  try {
    const transactionId = parseInt(req.params.transactionId);

    if (isNaN(transactionId)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await completeWithdrawalService(transactionId);

    return res.status(200).json({
      message: "Withdrawal processed successfully",
      mpesa: result.mpesaResult,
    });
  } catch (error: any) {
    console.error("Complete Withdrawal Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
