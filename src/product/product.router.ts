import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  getProductWithCategoryController,
  getProductWithReviewsController,
  getProductWithWishlistController,
  getProductWithCartController,
  getProductWithOrdersController
} from "./product.controller";
import { Express } from "express";

const product = (app: Express) => {
  // Create Product (Admin only)
  app.route("/product").post( adminRoleAuth,async (req, res, next) => {
    try {
      await createProductController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Products
  app.route("/product").get(async (req, res, next) => {
    try {
      await getProductsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Product by ID
  app.route("/product/:id").get(async (req, res, next) => {
    try {
      await getProductByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Product (Admin only)
  app.route("/product/:id").put(adminRoleAuth, async (req, res, next) => {
    try {
      await updateProductController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Product (Admin only)
  app.route("/product/:id").delete(adminRoleAuth, async (req, res, next) => {
    try {
      await deleteProductController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Product with Category
  app.route("/product/:id/category").get(async (req, res, next) => {
    try {
      await getProductWithCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Product with Reviews
  app.route("/product/:id/reviews").get(async (req, res, next) => {
    try {
      await getProductWithReviewsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Product with Wishlist
  app.route("/product/:id/wishlist").get(async (req, res, next) => {
    try {
      await getProductWithWishlistController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Product with Cart
  app.route("/product/:id/cart").get(async (req, res, next) => {
    try {
      await getProductWithCartController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Product with Orders
  app.route("/product/:id/orders").get(async (req, res, next) => {
    try {
      await getProductWithOrdersController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default product;
