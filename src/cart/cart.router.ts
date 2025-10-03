import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createCartController,
  getCartsController,
  getCartByIdController,
  updateCartController,
  deleteCartController,
  addCartItemController,
  updateCartItemController,
  removeCartItemController,
  getCartWithItemsController,
  getCartsWithItemsController,
} from "./cart.controller";
import { Express } from "express";

const cart = (app: Express) => {
  // Create Cart
  app.route("/cart").post(async (req, res, next) => {
    try {
      await createCartController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Carts (Admin only)
  app.route("/cart").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getCartsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Cart by ID
  app.route("/cart/:id").get(async (req, res, next) => {
    try {
      await getCartByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Cart
  app.route("/cart/:id").put(async (req, res, next) => {
    try {
      await updateCartController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Cart
  app.route("/cart/:id").delete(async (req, res, next) => {
    try {
      await deleteCartController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Add Item to Cart
  app.route("/cart/items").post(async (req, res, next) => {
    try {
      await addCartItemController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Cart Item
  app.route("/cart/items/:itemId").put(async (req, res, next) => {
    try {
      await updateCartItemController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Remove Cart Item
  app.route("/cart/items/:itemId").delete(async (req, res, next) => {
    try {
      await removeCartItemController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Cart with Items
  app.route("/cart/:id/items").get(async (req, res, next) => {
    try {
      await getCartWithItemsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Carts with Items
  app.route("/cart/with/items").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getCartsWithItemsController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default cart;
