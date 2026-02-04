import { Request, Response } from "express";
import {
  createOrUpdateOrderService,
  getAllOrdersService,
  getOrderByIdService,
  cancelOrderService,
  markOrderAsPaidService,
  getOrdersByUserIdService,
  getOrdersBySellerIdService,
  markOrderAsShippedService,
  assignOriginStationService,
  getOrdersByAgentIdService,
} from "./order.service";

//Create or Update Order
// export const createOrderController = async (req: Request, res: Response) => {
//   try {
//     const { userId, items, shippingAddress } = req.body;

//     if (!userId || !items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         message: "User ID and at least one item are required",
//       });
//     }

//     const data = await createOrUpdateOrderService(userId, items, shippingAddress);

//     return res.status(200).json({
//       message: "Order created or updated successfully",
//       data,
//     });
//   } catch (error: any) {
//     console.error("Create/Update Order Error:", error);
//     return res.status(500).json({
//       message: error.message || "Failed to create or update order",
//     });
//   }
// };

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      items,
      shippingAddress,
      pickupStationId,
      pickupAgentId,
    } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "User ID and at least one item are required",
      });
    }

   // Helper to safely convert to nullable number
const toNullableInt = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "" || Number(v) <= 0) return undefined;
  return Number(v);
};

const cleanPickupStationId = toNullableInt(pickupStationId);
const cleanPickupAgentId = toNullableInt(pickupAgentId);

    const data = await createOrUpdateOrderService(
      userId,
      items,
      shippingAddress,
      cleanPickupStationId,
      cleanPickupAgentId
    );

    return res.status(200).json({
      message: "Order created or updated successfully",
      data,
    });
  } catch (error: any) {
    console.error("Create/Update Order Error:", error);

    return res.status(500).json({
      message: error.message || "Failed to create or update order",
    });
  }
};


//Get All Orders
export const getAllOrdersController = async (_req: Request, res: Response) => {
  try {
    const orders = await getAllOrdersService();
    return res.status(200).json({
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error: any) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve orders",
    });
  }
};

//Get Order by ID
export const getOrderByIdController = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await getOrderByIdService(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error: any) {
    console.error("Get Order By ID Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve order",
    });
  }
};

//Cancel Unpaid Order
export const cancelOrderController = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = parseInt(req.body.userId);

    if (isNaN(orderId) || isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid orderId or userId",
      });
    }

    const result = await cancelOrderService(orderId, userId);

    return res.status(200).json({
      message: result.message || "Order cancelled successfully",
    });
  } catch (error: any) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to cancel order",
    });
  }
};

//Mark Order as Paid
export const markOrderPaidController = async (req: Request, res: Response) => {
  try {
    const { orderId, transactionRef } = req.body;

    if (!orderId || !transactionRef) {
      return res.status(400).json({
        message: "Order ID and transaction reference are required",
      });
    }

    const result = await markOrderAsPaidService(Number(orderId), transactionRef);

    return res.status(200).json({
      message: result.message || "Order marked as paid successfully",
      data: result.payment,
    });
  } catch (error: any) {
    console.error("Mark Order Paid Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to mark order as paid",
    });
  }
};


// Get Orders by User ID Controller
export const getOrdersByUserIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const orders = await getOrdersByUserIdService(userId);

    return res.status(200).json({
      message: "Orders for user retrieved successfully",
      data: orders,
    });
  } catch (error: any) {
    console.error("Get user Orders Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve user orders",
    });
    }
};

//get orders by seller id
export const getOrdersBySellerIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sellerId = parseInt(req.params.sellerId);

    if (isNaN(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const orders = await getOrdersBySellerIdService(sellerId);

    return res.status(200).json({
      message: "Orders for seller retrieved successfully",
      data: orders,
    });
  } catch (error: any) {
    console.error("Get seller Orders Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve seller orders",
    });
  }
};

export const assignOriginStationController = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ message: "stationId is required" });
    }

    const result = await assignOriginStationService(orderId, stationId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const markOrderAsShippedController = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const result = await markOrderAsShippedService(orderId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error marking order as shipped:", error.message || error);
    return res.status(500).json({ message: error.message || "Something went wrong" });
  }
};

//Get orders by agent id
export const getOrdersByAgentIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const agentId = parseInt(req.params.agentId);

    if (isNaN(agentId)) {
      return res.status(400).json({ message: "Invalid agent ID" });
    }

    const orders = await getOrdersByAgentIdService(agentId);

    return res.status(200).json({
      message: "Orders for agent retrieved successfully",
      data: orders,
    });
  } catch (error: any) {
    console.error("Get agent Orders Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve agent orders",
    });
  }
};