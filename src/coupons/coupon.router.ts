import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createCouponController,
  getCouponsController,
  getCouponByIdController,
  getCouponByCodeController,
  updateCouponController,
  deleteCouponController,
  getActiveCouponsController,
  getExpiredCouponsController,
  applyCouponController
} from "./coupon.controller";
import { Express } from "express";

const coupon = (app: Express) => {
  // Create Coupon (Admin only)
  app.route("/coupon").post(adminRoleAuth, async (req, res, next) => {
    try {
      await createCouponController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Coupons (Admin only)
  app.route("/coupon").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getCouponsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Coupon by ID
  app.route("/coupon/:id").get(async (req, res, next) => {
    try {
      await getCouponByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Coupon by Code
  app.route("/coupon/code/:code").get(async (req, res, next) => {
    try {
      await getCouponByCodeController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Active Coupons
  app.route("/coupon/active").get(async (req, res, next) => {
    try {
      await getActiveCouponsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Expired Coupons
  app.route("/coupon/expired").get(async (req, res, next) => {
    try {
      await getExpiredCouponsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Apply Coupon (User applies coupon at checkout)
  app.route("/coupon/apply").post(async (req, res, next) => {
    try {
      await applyCouponController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Coupon (Admin only)
  app.route("/coupon/:id").put(adminRoleAuth, async (req, res, next) => {
    try {
      await updateCouponController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Coupon (Admin only)
  app.route("/coupon/:id").delete(adminRoleAuth, async (req, res, next) => {
    try {
      await deleteCouponController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default coupon;
