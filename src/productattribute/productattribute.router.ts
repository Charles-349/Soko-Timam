import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createProductAttributeController,
  getProductAttributesController,
  getProductAttributeByIdController,
  getAttributesByProductIdController,
  updateProductAttributeController,
  deleteProductAttributeController,
  getProductAttributeWithProductController,
} from "./productattribute.controller";
import { Express } from "express";

const productAttribute = (app: Express) => {
  // CREATE 
  app.route("/product-attribute").post(adminRoleAuth, async (req, res, next) => {
    try {
      await createProductAttributeController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // READ
  app.route("/product-attribute").get(async (req, res, next) => {
    try {
      await getProductAttributesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/product-attribute/:id").get(async (req, res, next) => {
    try {
      await getProductAttributeByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/product/:productId/attributes").get(async (req, res, next) => {
    try {
      await getAttributesByProductIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // UPDATE
  app.route("/product-attribute/:id").put(adminRoleAuth, async (req, res, next) => {
    try {
      await updateProductAttributeController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // DELETE 
  app.route("/product-attribute/:id").delete(adminRoleAuth, async (req, res, next) => {
    try {
      await deleteProductAttributeController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // RELATION
  app.route("/product-attribute/:id/product").get(async (req, res, next) => {
    try {
      await getProductAttributeWithProductController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default productAttribute;
