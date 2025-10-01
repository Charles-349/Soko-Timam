import { adminRoleAuth } from "../middleware/bearAuth";
import { 
  createUserController,
  verifyUserController,
  resendVerificationCodeController,
  userLoginController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  getUserWithOrdersController,
  getUserWithCartController,
  getUserWithWishlistController,
  getUserWithReviewsController
} from "./user.controller";
import { Express } from "express";

const user = (app: Express) => {
  // Register User
  app.route("/user").post(async (req, res, next) => {
    try {
      await createUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Verify User
  app.route("/user/verify").post(async (req, res, next) => {
    try {
      await verifyUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Resend Verification Code
  app.route("/user/resend-verification").post(async (req, res, next) => {
    try {
      await resendVerificationCodeController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.route("/user/login").post(async (req, res, next) => {
    try {
      await userLoginController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Users (Admin only)
  app.route("/user").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getUsersController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get User by ID
  app.route("/user/:id").get(async (req, res, next) => {
    try {
      await getUserByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update User by ID
  app.route("/user/:id").put(async (req, res, next) => {
    try {
      await updateUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete User by ID
  app.route("/user/:id").delete(async (req, res, next) => {
    try {
      await deleteUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: User with Orders
  app.route("/user/:id/orders").get(async (req, res, next) => {
    try {
      await getUserWithOrdersController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: User with Cart
  app.route("/user/:id/cart").get(async (req, res, next) => {
    try {
      await getUserWithCartController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: User with Wishlist
  app.route("/user/:id/wishlist").get(async (req, res, next) => {
    try {
      await getUserWithWishlistController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: User with Reviews
  app.route("/user/:id/reviews").get(async (req, res, next) => {
    try {
      await getUserWithReviewsController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default user;
