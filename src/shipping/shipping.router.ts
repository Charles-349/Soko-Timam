import { Express } from "express";
import { adminRoleAuth } from "../middleware/bearAuth";
import {
  getShippingSettingsController,
  createShippingSettingsController,
  updateShippingSettingsController,
  getShippingDistancesController,
  getShippingDistanceByIdController,
  createShippingDistanceController,
  updateShippingDistanceController,
  deleteShippingDistanceController,
  calculateOrderShippingController,
} from "./shipping.controller";

const shippingAdmin = (app: Express) => {

  app.route("/shipping-settings").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getShippingSettingsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/shipping-settings").post(adminRoleAuth, async (req, res, next) => {
    try {
      await createShippingSettingsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/shipping-settings/:id").put(adminRoleAuth, async (req, res, next) => {
    try {
      await updateShippingSettingsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Shipping Distances (Admin only)
  app.route("/shipping-distances").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getShippingDistancesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/shipping-distances/:id").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getShippingDistanceByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/shipping-distances").post(adminRoleAuth, async (req, res, next) => {
    try {
      await createShippingDistanceController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/shipping-distances/:id").put(adminRoleAuth, async (req, res, next) => {
    try {
      await updateShippingDistanceController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/shipping-distances/:id").delete(adminRoleAuth, async (req, res, next) => {
    try {
      await deleteShippingDistanceController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Calculate Shipping for Order
  // GET /order-shipping/:orderId - full shipping breakdown
  app.route("/order-shipping/:orderId").get(async (req, res, next) => {
    try {
      await calculateOrderShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default shippingAdmin;
