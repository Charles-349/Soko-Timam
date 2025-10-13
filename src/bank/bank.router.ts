import { Express } from "express";
import { createBankAccount } from "./bank.controller";

const bank = (app: Express) => {
  // Create Bank Account
  app.route("/bank/account").post(async (req, res, next) => {
    try {
      await createBankAccount(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default bank;


