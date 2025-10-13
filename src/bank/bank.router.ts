import { Express } from "express";
import { createBankAccount } from "./bank.controller";
import { customerRoleAuth } from "../middleware/bearAuth";

const bank = (app: Express) => {
  // Create Bank Account
  app.route("/bank/account").post(customerRoleAuth, async (req, res, next) => {
    try {
      await createBankAccount(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default bank;


