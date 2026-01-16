import { adminRoleAuth } from "../middleware/bearAuth";
import {
  getSellerWalletController,
  getSellerWalletTransactionsController,
  creditSellerWalletController,
  debitSellerWalletController,
  requestWithdrawalController,
  completeWithdrawalController,
  getWalletTransactionsByWalletIdController,
  getPendingWithdrawalRequestsController,
} from "./wallet.controller";
import { Express } from "express";

const sellerWallet = (app: Express) => {
  // Get Seller Wallet
  app.route("/seller-wallet/:sellerId").get(async (req, res, next) => {
    try {
      await getSellerWalletController(req, res);
    } catch (error) {
      next(error);
    }
  });
      // Admin: Get All Wallet Transactions
    app
    .route("/admin/wallet-transactions")
    .get(adminRoleAuth, async (req, res, next) => {
      try {
        await getPendingWithdrawalRequestsController(req, res);
      } catch (error) {
        next(error);
      }
    });

  // Get Seller Wallet Transactions
  app
    .route("/seller-wallet/:sellerId/transactions")
    .get(async (req, res, next) => {
      try {
        await getSellerWalletTransactionsController(req, res);
      } catch (error) {
        next(error);
      }
    });

  // Credit Seller Wallet
  app.route("/seller-wallet/credit").post(async (req, res, next) => {
    try {
      await creditSellerWalletController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Debit Seller Wallet
  app.route("/seller-wallet/debit").post(async (req, res, next) => {
    try {
      await debitSellerWalletController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Seller: Request Withdrawal
  app
    .route("/seller-wallet/withdraw-request")
    .post(async (req, res, next) => {
      try {
        await requestWithdrawalController(req, res);
      } catch (error) {
        next(error);
      }
    });

  // Admin: Complete Withdrawal (M-Pesa B2C)
  app
    .route("/seller-wallet/withdraw-complete/:transactionId")
    .post(adminRoleAuth, async (req, res, next) => {
      try {
        await completeWithdrawalController(req, res);
      } catch (error) {
        next(error);
      }
    });


    // Get Wallet Transactions by Wallet ID
    app
    .route("/seller-wallet/transactions/:walletId")
    .get(async (req, res, next) => {
      try {
        await getWalletTransactionsByWalletIdController(req, res);
      } catch (error) {
        next(error);
      }
    });


};

export default sellerWallet;
