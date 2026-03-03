import { Request, Response } from "express";
import {
  createReturnService,
  processReturnRefundService,
  getReturnsService,
  getReturnByIdService,
} from "./return.sevice";

// Create Return Request
export const createReturnController = async (req: Request, res: Response) => {
  try {
    const { orderItemIds, reason } = req.body;

    if (!orderItemIds || !orderItemIds.length || !reason) {
      return res
        .status(400)
        .json({ message: "Order item IDs and reason are required" });
    }

    const returns = await createReturnService({ orderItemIds, reason });

    return res.status(201).json({
      message: "Return request(s) created successfully",
      returns,
    });
  } catch (error: any) {
    console.error("Create Return Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Process Refund for Return
export const processReturnRefundController = async (
  req: Request,
  res: Response
) => {
  try {
    const { returnIds } = req.body;

    if (!returnIds || !returnIds.length) {
      return res.status(400).json({ message: "Return IDs are required" });
    }

    const results = await processReturnRefundService(returnIds);

    return res.status(200).json({
      message: "Return refund(s) processed",
      results,
    });
  } catch (error: any) {
    console.error("Process Return Refund Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get All Returns 
export const getReturnsController = async (req: Request, res: Response) => {
  try {
    const { status, sellerId } = req.query;

    const filters: any = {};
    if (status) filters.status = String(status);
    if (sellerId) filters.sellerId = Number(sellerId);

    const returns = await getReturnsService(filters);

    return res.status(200).json({
      message: "Returns retrieved successfully",
      returns,
    });
  } catch (error: any) {
    console.error("Get Returns Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get Single Return with Refund History
export const getReturnByIdController = async (req: Request, res: Response) => {
  try {
    const returnId = parseInt(req.params.returnId);

    if (isNaN(returnId)) {
      return res.status(400).json({ message: "Invalid return ID" });
    }

    const returnRecord = await getReturnByIdService(returnId);

    return res.status(200).json({
      message: "Return retrieved successfully",
      return: returnRecord,
    });
  } catch (error: any) {
    console.error("Get Return By ID Error:", error);
    return res.status(500).json({ message: error.message });
  }
};