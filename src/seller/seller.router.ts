
import { Express } from "express";
import { createSeller } from "./seller.controller";

const seller = (app: Express) => {
  // Register Seller 
  app.route("/seller/register").post(async (req, res, next) => {
    try {
      await createSeller(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default seller;
