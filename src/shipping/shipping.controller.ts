import { Request, Response } from "express";
import {
  createShippingService,
  getShippingsService,
  getShippingByIdService,
  updateShippingService,
  deleteShippingService,
  getShippingByOrderIdService,
  getShippingsByStatusService,
  getActiveShippingsService,
  getCompletedShippingsService,
  getShippingsByDateRangeService,
  getShippingWithOrderService,
} from "./shipping.service";

// CREATE
export const createShippingController = async (req: Request, res: Response) => {
  try {
    const shipping = req.body;
    const newShipping = await createShippingService(shipping);

    return res.status(201).json({
      message: "Shipping created successfully",
      shipping: newShipping,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

//READ ALL
export const getShippingsController = async (req: Request, res: Response) => {
  try {
    const shippings = await getShippingsService();
    return res.status(200).json({
      message: "Shippings retrieved successfully",
      shippings,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// READ ONE
export const getShippingByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const shipping = await getShippingByIdService(id);

    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    return res.status(200).json({
      message: "Shipping retrieved successfully",
      shipping,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateShippingController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedShipping = await updateShippingService(id, req.body);

    if (!updatedShipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    return res.status(200).json({ message: "Shipping updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

//DELETE
export const deleteShippingController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedShipping = await deleteShippingService(id);

    if (!deletedShipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    return res.status(200).json({ message: "Shipping deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get shipping by Order ID
export const getShippingByOrderIdController = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const shipping = await getShippingByOrderIdService(orderId);

    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found for this order" });
    }

    return res.status(200).json({ shipping });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get shippings by Status
export const getShippingsByStatusController = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const shippings = await getShippingsByStatusService(status);
    return res.status(200).json({ shippings });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get active shippings
export const getActiveShippingsController = async (req: Request, res: Response) => {
  try {
    const shippings = await getActiveShippingsService();
    return res.status(200).json({ shippings });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get completed shippings
export const getCompletedShippingsController = async (req: Request, res: Response) => {
  try {
    const shippings = await getCompletedShippingsService();
    return res.status(200).json({ shippings });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get shippings by Date Range
export const getShippingsByDateRangeController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const shippings = await getShippingsByDateRangeService(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return res.status(200).json({ shippings });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Shipping with related Order
export const getShippingWithOrderController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const shipping = await getShippingWithOrderService(id);

    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    return res.status(200).json({ shipping });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
