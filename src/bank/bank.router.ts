import { Express } from "express";
import { createBankAccount, deleteBankAccount, getAllBankAccounts, getBankAccountById, getBankAccountsBySellerUsername, getBankDetailsByShopId, getSellerBankAccounts, updateBankAccount } from "./bank.controller";
import { adminRoleAuth, customerRoleAuth, SellerRoleAuth } from "../middleware/bearAuth";

const bank = (app: Express) => {
  // Create Bank Account
  app.route("/bank/account").post( async (req, res, next) => {
    try {
      await createBankAccount(req, res);
    } catch (error) {
      next(error);
    }
  });

   //Get all bank accounts by sellerid
  app.route("/bank/accounts/seller/:sellerId").get(async (req, res, next) => {
    try {
      await getSellerBankAccounts(req, res);
    } catch (error) {
      next(error);
    }
  });

    //Get Bank Accounts by Seller Username (Admin only)
  app.get("/bank/accounts/seller/username/:username", adminRoleAuth, async (req, res, next) => {
    try {
      await getBankAccountsBySellerUsername(req, res);
    } catch (error) {
      next(error);
    }
  });
  

  //Get all bank accounts (admin only)
  app.route("/bank/accounts").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getAllBankAccounts(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get single bank account by ID
  app.route("/bank/account/:id").get(async (req, res, next) => {
    try {
      await getBankAccountById(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Update bank account by ID
  app.route("/bank/account/:id").put(async (req, res, next) => {
    try {
      await updateBankAccount(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Delete bank account by ID
  app.route("/bank/account/:id").delete(async (req, res, next) => {
    try {
      await deleteBankAccount(req, res);
    } catch (error) {
      next(error);
    }
  });

    app.route("/bank/accounts/seller/username/:username").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getBankAccountsBySellerUsername(req, res);
    } catch (error) {
      next(error);
    }
  });
  //get bank details by shopId
  app.route("/bank/details/shop/:shopId").get(async (req, res, next) => {
    try {
      await getBankDetailsByShopId(req, res);
    } catch (error) {
      next(error);
    }
  });

};

export default bank;


