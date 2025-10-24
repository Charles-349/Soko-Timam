import { adminRoleAuth } from "../middleware/bearAuth";
import { 
  createUserController,
  userLoginController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  getUserWithOrdersController,
  getUserWithCartController,
  getUserWithWishlistController,
  getUserWithReviewsController,
  getUserByEmailController,
  forgotPassword,
  resetPassword
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

  // Login
  app.route("/user/login").post(async (req, res, next) => {
    try {
      await userLoginController(req, res);
    } catch (error) {
      next(error);
    }
  });

//get user by email
app.route("/user/email/:email").get(async (req, res, next) => {
  try {
    await getUserByEmailController(req, res);
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
  app.route("/user/:id").put(adminRoleAuth,async (req, res, next) => {
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

//forgot password
   app.route("/user/forgot-password").get(async (req, res, next) => {
    try {
      await forgotPassword(req, res);
    } catch (error) {
      next(error);
    }
  });

  // resert password
  app.route("/user/reset-password").get(async (req, res, next) => {
    try {
      await resetPassword(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default user;
