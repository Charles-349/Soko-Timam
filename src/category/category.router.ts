import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createCategoryController,
  getCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
  getCategoryWithProductsController,
} from "./category.controller";
import { Express } from "express";

const category = (app: Express) => {
  // Create Category (Admin only)
  app.route("/category").post(adminRoleAuth, async (req, res, next) => {
    try {
      await createCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Categories
  app.route("/category").get(async (req, res, next) => {
    try {
      await getCategoriesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Category by ID
  app.route("/category/:id").get(async (req, res, next) => {
    try {
      await getCategoryByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Category by ID (Admin only)
  app.route("/category/:id").put(adminRoleAuth, async (req, res, next) => {
    try {
      await updateCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Category by ID (Admin only)
  app.route("/category/:id").delete(adminRoleAuth, async (req, res, next) => {
    try {
      await deleteCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Category with Products
  app.route("/category/:id/products").get(async (req, res, next) => {
    try {
      await getCategoryWithProductsController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default category;
