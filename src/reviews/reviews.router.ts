import { adminRoleAuth } from "../middleware/bearAuth";
import { 
  createReviewController,
  getReviewsController,
  getReviewByIdController,
  updateReviewController,
  deleteReviewController,
  getReviewsByProductController,
  getReviewsByUserController
} from "./reviews.controller";
import { Express } from "express";

const review = (app: Express) => {
  // Create Review
  app.route("/review").post(async (req, res, next) => {
    try {
      await createReviewController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Reviews (Admin only)
  app.route("/review").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getReviewsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Review by ID
  app.route("/review/:id").get(async (req, res, next) => {
    try {
      await getReviewByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Review by ID
  app.route("/review/:id").put(async (req, res, next) => {
    try {
      await updateReviewController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Review by ID
  app.route("/review/:id").delete(async (req, res, next) => {
    try {
      await deleteReviewController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Reviews by Product
  app.route("/product/:id/reviews").get(async (req, res, next) => {
    try {
      await getReviewsByProductController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Reviews by User
  app.route("/user/:id/reviews").get(async (req, res, next) => {
    try {
      await getReviewsByUserController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default review;
