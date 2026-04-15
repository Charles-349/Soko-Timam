import { Request, Response } from "express";
import {
  createReturnService,
  processReturnRefundService,
  getReturnsService,
  getReturnByIdService,
  reviewReturnService,
  processReturnExchangeService,
  handleReplacementShipmentDeliveredService,
  processFinalReturnResolution,
  getSellerReturnsService,
  getReturnsByPickupLocationService,
  getReturnsByOriginStationService,
  getAllReturnsService,
} from "./return.sevice";

// Create Return Request
export const createReturnController = async (req: Request, res: Response) => {
  try {
    const { orderItemIds, reason, resolutionType } = req.body;

    if (!orderItemIds || !orderItemIds.length || !reason) {
      return res
        .status(400)
        .json({ message: "Order item IDs and reason are required" });
    }

    const returns = await createReturnService({ orderItemIds, reason, resolutionType });

    return res.status(201).json({
      message: "Return request(s) created successfully",
      returns,
    });
  } catch (error: any) {
    console.error("Create Return Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//REVIEW RETURN REQUEST - Approve or Reject
export const reviewReturnController = async (
  req: Request,
  res: Response
) => {
  try {
    const { returnId } = req.params;
    const {
      action,
      resolutionType,
      refundResponsibility,
      adminNote,
    } = req.body;

    if (!returnId || !action) {
      return res.status(400).json({
        message: "Return ID and action are required",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: "Action must be approve or reject",
      });
    }

    const result = await reviewReturnService({
      returnId: Number(returnId),
      action,
      resolutionType,
      refundResponsibility,
      adminNote,
    });

    return res.status(200).json({
      message: result.message,
    });
  } catch (error: any) {
    console.error("Review Return Error:", error);
    return res.status(500).json({
      message: error.message,
    });
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

//Process exchange for Return
export const processReturnExchangeController = async (
  req: Request,
  res: Response
) => {
  try {
    const { returnIds } = req.body;

    if (!returnIds || !returnIds.length) {
      return res.status(400).json({ message: "Return IDs are required" });
    }

    const results = await processReturnExchangeService(returnIds);

    return res.status(200).json({
      message: "Return exchange(s) processed",
      results,
    });
  } catch (error: any) {
    console.error("Process Return Exchange Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//Shipment delivered handler for replacement shipments
export const handleReplacementShipmentDeliveredController = async (
  req: Request,
  res: Response
) => {
  try {
    const { shipmentId } = req.params;

    if (!shipmentId) {
      return res.status(400).json({ message: "Shipment ID is required" });
    }

    const result = await handleReplacementShipmentDeliveredService(Number(shipmentId));

    return res.status(200).json({
      message: result.message,
    });
  } catch (error: any) {
    console.error("Handle Replacement Shipment Delivered Error:", error);
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


export const triggerReturnResolutionController = async (
  req: Request,
  res: Response
) => {
  try {
    const { returnId } = req.params;

    if (!returnId) {
      return res.status(400).json({
        message: "Return ID is required",
      });
    }

    const result = await processFinalReturnResolution(Number(returnId));

    return res.status(200).json({
      message: result.message,
      returnId: result.returnId,
      data: result.data,
    });

  } catch (error: any) {
    console.error("Trigger Return Resolution Error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getSellerReturnsController = async (req: Request, res: Response) => {
  try {
    const sellerId = Number(req.params.sellerId);

    if (!sellerId) {
      return res.status(400).json({ message: "Invalid seller id" });
    }

    const data = await getSellerReturnsService(sellerId);

    return res.status(200).json({
      message: "Seller returns fetched successfully",
      count: data.length,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch seller returns",
    });
  }
};

export const getReturnsByPickupLocationController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    const data = await getReturnsByPickupLocationService(user);

     if (!data || data.length === 0) {
      return res.status(200).json({
        message: "No returns found for this pickup location",
      });
    }

    return res.status(200).json({
      message: "Pickup location returns fetched successfully",
      data,
    });

  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getReturnsByOriginStationController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    const data = await getReturnsByOriginStationService(user);

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "No returns found for this origin station",
      });
    }

    return res.status(200).json({
      message: "Origin station returns fetched successfully",
      data,
    });

  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllReturnsController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;
    const query = req.query;

    const data = await getAllReturnsService(user, query);

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "No returns found",
      });
    }

    return res.status(200).json({
      message: "Returns fetched successfully",
      data,
    });

  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};