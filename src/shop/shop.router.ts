import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createShop,
  getAllShopsController,
  getShopByIdController,
  getShopsByOwnerController,
  updateShopController,
  deleteShopController,
  getShopWithProductsController,
  getShopWithOrdersController,
} from "./shop.controller";

import multer from "multer";
import { Express} from "express";
import { Request, Response } from "express";

const upload = multer({ dest: "temp/" }); // temporary upload folder

const shop = (app: Express) => {
   // Create Shop (only authenticated user)
  app
    .route("/shop")
    .post(
      adminRoleAuth,
      upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "cover", maxCount: 1 },
      ]),
      async (req, res, next) => {
        try {
          await createShop(req, res);
        } catch (error) {
          next(error);
        }
      }
    );
  // Get All Shops (Admin only)
  app.route("/shop").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getAllShopsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Shop by ID
  app.route("/shop/:id").get(async (req, res, next) => {
    try {
      await getShopByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Shops by Owner
  app.route("/shop/owner/:ownerId").get(async (req, res, next) => {
    try {
      await getShopsByOwnerController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Shop
  app.route("/shop/:id").put(async (req, res, next) => {
    try {
      await updateShopController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Shop
  app.route("/shop/:id").delete(async (req, res, next) => {
    try {
      await deleteShopController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Shop with Products
  app.route("/shop/:id/products").get(async (req, res, next) => {
    try {
      await getShopWithProductsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Shop with Orders
  app.route("/shop/:id/orders").get(async (req, res, next) => {
    try {
      await getShopWithOrdersController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default shop;
