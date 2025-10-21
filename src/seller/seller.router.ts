
import { Express } from "express";
import { createSeller, getProductsBySellerId, getSellerByUserId } from "./seller.controller";

const seller = (app: Express) => {
  // Register Seller 
  app.route("/seller/register").post(async (req, res, next) => {
    try {
      await createSeller(req, res);
    } catch (error) {
      next(error);
    }
  });

  //get seller details by user id
  app.route("/seller/user/:userId").get(async (req, res, next) => {
    try {
      await getSellerByUserId(req, res);
    } catch (error) {
      next(error);
    }
  }); 

  //get all products for a seller by seller id
  app.route("/seller/:sellerId/products").get(async (req, res, next) => {
    try {
      await getProductsBySellerId(req, res);
    } catch (error) {
      next(error);
    }
  });                 
};

export default seller;
