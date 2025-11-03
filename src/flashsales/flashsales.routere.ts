import { Express } from "express";
import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createFlashSaleController,
  getFlashSalesController,
  getFlashSaleByIdController,
  getActiveFlashSalesController,
  // getUpcomingFlashSalesController,
  getEndedFlashSalesController,
  updateFlashSaleController,
  deleteFlashSaleController,
  getFlashSaleWithProductController,
  updateFlashSaleStatusesController,
  getUpcomingFlashSalesControllerV2,
} from "./flashsales.controller";

const flashsales = (app: Express) => {
  // Create Flash Sale 
  app.route("/flashsales").post(async (req, res, next) => {
    try {
      await createFlashSaleController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Flash Sales
  app.route("/flashsales").get(async (req, res, next) => {
    try {
      await getFlashSalesController(req, res);
    } catch (error) {
      next(error);
    }
  });

   // Get Active Flash Sales
  app.route("/flashsales/active").get(async (req, res, next) => {
    try {
      await getActiveFlashSalesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Upcoming Flash Sales
  app.route("/flashsales/upcoming").get(async (req, res, next) => {
    try {
      await getUpcomingFlashSalesControllerV2(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Ended Flash Sales
  app.route("/flashsales/ended").get(async (req, res, next) => {
    try {
      await getEndedFlashSalesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Flash Sale by ID
  app.route("/flashsales/:id").get(async (req, res, next) => {
    try {
      await getFlashSaleByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });


  // Update Flash Sale by ID
  app.route("/flashsales/:id").put(async (req, res, next) => {
    try {
      await updateFlashSaleController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Flash Sale by ID
  app.route("/flashsales/:id").delete(async (req, res, next) => {
    try {
      await deleteFlashSaleController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Flash Sale with Product Details
  app.route("/flashsales/:id/products").get(async (req, res, next) => {
    try {
      await getFlashSaleWithProductController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Flash Sale Statuses
  app.route("/flashsales/update-statuses").put(async (req, res, next) => {
    try {
      await updateFlashSaleStatusesController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default flashsales;
