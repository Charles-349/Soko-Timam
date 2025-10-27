
import { Express } from "express";
import {
  createCategoryController,
  getCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
  getCategoryWithProductsController,
} from "./category.controller";
import { adminRoleAuth } from "../middleware/bearAuth";


const category = (app: Express) => {
  // Create Category 
  app.post("/category", adminRoleAuth, async (req, res, next) => {
    try {
      await createCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get All Categories
  app.get("/category", async (req, res, next) => {
    try {
      await getCategoriesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Category by ID
  app.get("/category/:id", async (req, res, next) => {
    try {
      await getCategoryByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Update Category by ID 
  app.put("/category/:id",async (req, res, next) => {
    try {
      await updateCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Delete Category by ID 
  app.delete("/category/:id",async (req, res, next) => {
    try {
      await deleteCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Category with Products
  app.get("/category/:id/products", async (req, res, next) => {
    try {
      await getCategoryWithProductsController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default category;
