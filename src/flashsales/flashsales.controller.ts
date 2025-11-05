import { Request, Response } from "express";
import {
  createFlashSaleService,
  getFlashSalesService,
  getFlashSaleByIdService,
  getActiveFlashSalesService,
  getEndedFlashSalesService,
  updateFlashSaleService,
  deleteFlashSaleService,
  getFlashSaleWithProductService,
  updateFlashSaleStatusesService,
  getUpcomingFlashSalesService,
  getFlashSalesBySellerService,
} from "./flashsales.service";

// Create Flash Sale
export const createFlashSaleController = async (req: Request, res: Response) => {
  try {
    const flashSale = req.body;
    await createFlashSaleService(flashSale);
    return res.status(201).json({ message: "Flash sale created successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get All Flash Sales
export const getFlashSalesController = async (req: Request, res: Response) => {
  try {
    const flashSales = await getFlashSalesService();
    return res
      .status(200)
      .json({ message: "Flash sales retrieved successfully", data: flashSales });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Flash Sale by ID
export const getFlashSaleByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const flashSale = await getFlashSaleByIdService(id);
    if (!flashSale)
      return res.status(404).json({ message: "Flash sale not found" });

    return res
      .status(200)
      .json({ message: "Flash sale retrieved successfully", data: flashSale });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Active Flash Sales
export const getActiveFlashSalesController = async (req, res) => {
  try {
    const activeSales = await getActiveFlashSalesService();
    return res.status(200).json({
      message: "Active flash sales retrieved successfully",
      data: activeSales,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Ended Flash Sales
export const getEndedFlashSalesController = async (req: Request, res: Response) => {
  try {
    const endedSales = await getEndedFlashSalesService();
    return res.status(200).json({
      message: "Ended flash sales retrieved successfully",
      data: endedSales,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update Flash Sale
export const updateFlashSaleController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateFlashSaleService(id, req.body);
    if (!updated)
      return res.status(404).json({ message: "Flash sale not found" });

    return res.status(200).json({ message: "Flash sale updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Flash Sale
export const deleteFlashSaleController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteFlashSaleService(id);
    if (!deleted)
      return res.status(404).json({ message: "Flash sale not found" });

    return res.status(200).json({ message: "Flash sale deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Flash Sale with Product Details
export const getFlashSaleWithProductController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const flashSaleWithProduct = await getFlashSaleWithProductService(id);
    if (!flashSaleWithProduct)
      return res.status(404).json({ message: "Flash sale not found" });

    return res.status(200).json({
      message: "Flash sale with product retrieved successfully",
      data: flashSaleWithProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Auto-update Flash Sale Statuses 
export const updateFlashSaleStatusesController = async (
  req: Request,
  res: Response
) => {
  try {
    await updateFlashSaleStatusesService();
    return res
      .status(200)
      .json({ message: "Flash sale statuses updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

//get upcoming flashsales
export const getUpcomingFlashSalesController = async (
  req: Request,
  res: Response
) => {
  try {
    const upcomingSales = await getUpcomingFlashSalesService ();
    return res.status(200).json({
      message: "Upcoming flash sales retrieved successfully",
      data: upcomingSales,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Flash Sales by Seller
export const getFlashSalesBySellerController = async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.sellerId);

    if (isNaN(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const flashSales = await getFlashSalesBySellerService(sellerId);

    if (!flashSales || flashSales.length === 0) {
      return res.status(404).json({ message: "No flash sales found for this seller" });
    }

    return res.status(200).json({
      message: "Flash sales retrieved successfully",
      count: flashSales.length,
      data: flashSales,
    });
  } catch (error) {
    console.error("Error fetching flash sales by seller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
