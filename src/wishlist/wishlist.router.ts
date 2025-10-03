import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createWishlistController,
  getWishlistsController,
  getWishlistByIdController,
  updateWishlistController,
  deleteWishlistController,
  getWishlistWithUserController,
  getWishlistWithProductController,
  getWishlistsByUserController,
} from "./wishlist.controller";
import { Express } from "express";

const wishlist = (app: Express) => {
  // Create Wishlist Item
  app.route("/wishlist").post(async (req, res, next) => {
    try {
      await createWishlistController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Wishlists (Admin only)
  app.route("/wishlist").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getWishlistsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Wishlist by ID
  app.route("/wishlist/:id").get(async (req, res, next) => {
    try {
      await getWishlistByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Wishlist by ID
  app.route("/wishlist/:id").put(async (req, res, next) => {
    try {
      await updateWishlistController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Wishlist by ID
  app.route("/wishlist/:id").delete(async (req, res, next) => {
    try {
      await deleteWishlistController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Wishlist with User
  app.route("/wishlist/:id/user").get(async (req, res, next) => {
    try {
      await getWishlistWithUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Wishlist with Product
  app.route("/wishlist/:id/product").get(async (req, res, next) => {
    try {
      await getWishlistWithProductController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Wishlists by User (all products a user has saved)
  app.route("/wishlist/user/:userId").get(async (req, res, next) => {
    try {
      await getWishlistsByUserController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default wishlist;
