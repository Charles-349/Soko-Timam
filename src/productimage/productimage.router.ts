import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createProductImageController,
  getProductImagesController,
  getProductImageByIdController,
  getImagesByProductIdController,
  updateProductImageController,
  deleteProductImageController,
  getProductImageWithProductController,
  getProductWithImagesController,
} from "./productimage.controller";
import { Express } from "express";

const productImage = (app: Express) => {
  // CREATE
  app.route("/product-image").post(adminRoleAuth, async (req, res, next) => {
    try {
      await createProductImageController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // READ 
  // Get All Product Images
  app.route("/product-image").get(async (req, res, next) => {
    try {
      await getProductImagesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Product Image by ID
  app.route("/product-image/:id").get(async (req, res, next) => {
    try {
      await getProductImageByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Images for a Given Product
  app.route("/product/:productId/images").get(async (req, res, next) => {
    try {
      await getImagesByProductIdController(req, res);
    } catch (error) {
      next(error);
    }
  });
//UPDATE
  app.route("/product-image/:id").put(adminRoleAuth, async (req, res, next) => {
    try {
      await updateProductImageController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //DELETE
  app.route("/product-image/:id").delete(adminRoleAuth, async (req, res, next) => {
    try {
      await deleteProductImageController(req, res);
    } catch (error) {
      next(error);
    }
  });

  
  // Product Image with Product
  app.route("/product-image/:id/product").get(async (req, res, next) => {
    try {
      await getProductImageWithProductController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Product with All Its Images
  app.route("/product-with-images/:productId").get(async (req, res, next) => {
    try {
      await getProductWithImagesController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default productImage;
