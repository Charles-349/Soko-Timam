import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createShippingController,
  getShippingsController,
  getShippingByIdController,
  updateShippingController,
  deleteShippingController,
  getShippingByOrderIdController,
  getShippingsByStatusController,
  getActiveShippingsController,
  getCompletedShippingsController,
  getShippingsByDateRangeController,
  getShippingWithOrderController,
} from "./shipping.controller";
import { Express } from "express";

const shipping = (app: Express) => {
  // Create Shipping
  app.route("/shipping").post(async (req, res, next) => {
    try {
      await createShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Shippings (Admin only)
  app.route("/shipping").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getShippingsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Shipping by ID
  app.route("/shipping/:id").get(async (req, res, next) => {
    try {
      await getShippingByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Shipping by ID
  app.route("/shipping/:id").put(async (req, res, next) => {
    try {
      await updateShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Shipping by ID
  app.route("/shipping/:id").delete(async (req, res, next) => {
    try {
      await deleteShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Shipping by Order ID
  app.route("/shipping/order/:orderId").get(async (req, res, next) => {
    try {
      await getShippingByOrderIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Shippings by Status
  app.route("/shipping/status/:status").get(async (req, res, next) => {
    try {
      await getShippingsByStatusController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Active Shippings
  app.route("/shipping/active").get(async (req, res, next) => {
    try {
      await getActiveShippingsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Completed Shippings
  app.route("/shipping/completed").get(async (req, res, next) => {
    try {
      await getCompletedShippingsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Shippings by Date Range
  app.route("/shipping/date-range").get(async (req, res, next) => {
    try {
      await getShippingsByDateRangeController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Shipping with related Order
  app.route("/shipping/:id/order").get(async (req, res, next) => {
    try {
      await getShippingWithOrderController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default shipping;
