import { Express } from "express";
import { createBankAccount, deleteBankAccount, getAllBankAccounts, getBankAccountById, getBankAccountsBySellerUsername, getSellerBankAccounts, updateBankAccount } from "./bank.controller";
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

   //Get all bank accounts for logged-in seller
  app.route("/bank/accounts/seller").get(async (req, res, next) => {
    try {
      await getSellerBankAccounts(req, res);
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

};

export default bank;


