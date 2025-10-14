
import { adminRoleAuth, customerRoleAuth } from "../middleware/bearAuth";
import {
  createShop,
  getAllShopsController,
  getShopByIdController,
  getShopsBySellerController,
  updateShopController,
  deleteShopController,
  getShopWithProductsController,
  getShopWithOrdersController,
  getShopWithOwner,
} from "./shop.controller";

import multer from "multer";
import { Express } from "express";

const upload = multer({ dest: "temp/" }); // temporary upload folder

const shop = (app: Express) => {
  // CREATE SHOP (Authenticated seller)
  app
    .route("/shop")
    .post(
      customerRoleAuth,
      upload.fields([{ name: "logo", maxCount: 1 }]),
      async (req, res, next) => {
        try {
          await createShop(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

  // GET ALL SHOPS (Admin only)
  app.route("/shop").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getAllShopsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // GET SHOP BY ID
  app.route("/shop/:id").get(async (req, res, next) => {
    try {
      await getShopByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // GET SHOPS BY SELLER
  app.route("/shop/seller/:sellerId").get(async (req, res, next) => {
    try {
      await getShopsBySellerController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // UPDATE SHOP
  app.route("/shop/:id").put(async (req, res, next) => {
    try {
      await updateShopController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // DELETE SHOP
  app.route("/shop/:id").delete(async (req, res, next) => {
    try {
      await deleteShopController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // SHOP WITH PRODUCTS
  app.route("/shop/:id/products").get(async (req, res, next) => {
    try {
      await getShopWithProductsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // SHOP WITH ORDERS
  app.route("/shop/:id/orders").get(async (req, res, next) => {
    try {
      await getShopWithOrdersController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //get shop with owner,products and order items
  app.route("/shop/:id/owner").get(async (req, res, next) => {
    try {
      await getShopWithOwner(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default shop;

