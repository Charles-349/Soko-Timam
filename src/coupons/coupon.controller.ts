import { Request, Response } from "express";
import {
  createCouponService,
  getCouponsService,
  getCouponByIdService,
  getCouponByCodeService,
  updateCouponService,
  deleteCouponService,
  getActiveCouponsService,
  getExpiredCouponsService,
  applyCouponService,
} from "./coupons.service";

// Create Coupon
export const createCouponController = async (req: Request, res: Response) => {
  try {
    const coupon = req.body;
    await createCouponService(coupon);
    return res.status(201).json({ message: "Coupon created successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get All Coupons
export const getCouponsController = async (req: Request, res: Response) => {
  try {
    const coupons = await getCouponsService();
    return res
      .status(200)
      .json({ message: "Coupons retrieved successfully", data: coupons });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Coupon by ID
export const getCouponByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const coupon = await getCouponByIdService(id);
    if (!coupon)
      return res.status(404).json({ message: "Coupon not found" });

    return res
      .status(200)
      .json({ message: "Coupon retrieved successfully", data: coupon });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Coupon by Code
export const getCouponByCodeController = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const coupon = await getCouponByCodeService(code);
    if (!coupon)
      return res.status(404).json({ message: "Coupon not found" });

    return res
      .status(200)
      .json({ message: "Coupon retrieved successfully", data: coupon });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update Coupon
export const updateCouponController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedCoupon = await updateCouponService(id, req.body);
    if (!updatedCoupon)
      return res.status(404).json({ message: "Coupon not found" });

    return res.status(200).json({
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Coupon
export const deleteCouponController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedCoupon = await deleteCouponService(id);
    if (!deletedCoupon)
      return res.status(404).json({ message: "Coupon not found" });

    return res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Active Coupons
export const getActiveCouponsController = async (req: Request, res: Response) => {
  try {
    const activeCoupons = await getActiveCouponsService();
    return res.status(200).json({
      message: "Active coupons retrieved successfully",
      data: activeCoupons,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Expired Coupons
export const getExpiredCouponsController = async (req: Request, res: Response) => {
  try {
    const expiredCoupons = await getExpiredCouponsService();
    return res.status(200).json({
      message: "Expired coupons retrieved successfully",
      data: expiredCoupons,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Apply Coupon
export const applyCouponController = async (req: Request, res: Response) => {
  try {
    const { code, total } = req.body;
    const result = await applyCouponService(code, total);

    if (!result)
      return res
        .status(400)
        .json({ message: "Invalid or expired coupon" });

    return res.status(200).json({
      message: "Coupon applied successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
