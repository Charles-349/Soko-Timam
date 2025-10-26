import { adminRoleAuth } from "../middleware/bearAuth";
import {
  getCartsController,
  getCartByIdController,
  updateCartController,
  deleteCartController,
  updateCartItemController,
  removeCartItemController,
  getCartWithItemsController,
  getCartsWithItemsController,
  createOrAddToCartController,
  getCartWithItemsByUserController,
} from "./cart.controller";
import { Express } from "express";

const cart = (app: Express) => {

  //createOrAddToCartController
  app.route("/cart").post(async (req, res, next) => {
    try {
      await createOrAddToCartController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Carts 
  app.route("/cart").get( async (req, res, next) => {
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
  app.route("/cart/with/items").get(async (req, res, next) => {
    try {
      await getCartsWithItemsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //get cart with items by user id
   app.route("/cart/with/items/:userId").get(async (req, res, next) => {
    try {
      await getCartWithItemsByUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

};

export default cart;
