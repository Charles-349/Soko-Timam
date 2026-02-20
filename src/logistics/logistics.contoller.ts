import { Request, Response } from "express";
import {
  createStationService,
  getStationsService,
  getStationByIdService,
  updateStationService,
  deleteStationService,
  createAgentService,
  getAgentsService,
  getAgentByIdService,
  updateAgentService,
  deleteAgentService,
  createShippingService,
  getShippingService,
  getShippingByIdService,
  updateShippingService,
  deleteShippingService,
  getShippingWithOrderService,
  getShippingsByDateRangeService,
  getCompletedShippingsService,
  getShippingsByStatusService,
  getShippingByOrderIdService,
  getShippingsByAgentIdService,
  getShippingsByStationIdService,
  getStationByUserIdService,
} from "./logistics.service";

// STATIONS
export const createStationController = async (req: Request, res: Response) => {
  try {
    const station = req.body;
    const result = await createStationService(station);
    res.status(201).json({ message: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStationsController = async (req: Request, res: Response) => {
  try {
    const stations = await getStationsService();
    res.status(200).json({ message: "Stations retrieved successfully", stations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStationByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const station = await getStationByIdService(id);
    if (!station) return res.status(404).json({ message: "Station not found" });
    res.status(200).json({ message: "Station retrieved successfully", station });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStationController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateStationService(id, req.body);
    if (!updated) return res.status(404).json({ message: "Station not found" });
    res.status(200).json({ message: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

//Get station by user id
export const getStationByUserIdController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const station = await getStationByUserIdService(userId);
    if (!station) return res.status(404).json({ message: "Station not found for this user" });
    res.status(200).json({ message: "Station retrieved successfully", station });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStationController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteStationService(id);
    if (!deleted) return res.status(404).json({ message: "Station not found" });
    res.status(200).json({ message: deleted });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// AGENTS
export const createAgentController = async (req: Request, res: Response) => {
  try {
    const agent = req.body;
    const result = await createAgentService(agent);
    res.status(201).json({ message: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAgentsController = async (req: Request, res: Response) => {
  try {
    const agents = await getAgentsService();
    res.status(200).json({ message: "Agents retrieved successfully", agents });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAgentByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const agent = await getAgentByIdService(id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.status(200).json({ message: "Agent retrieved successfully", agent });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAgentController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateAgentService(id, req.body);
    if (!updated) return res.status(404).json({ message: "Agent not found" });
    res.status(200).json({ message: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAgentController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteAgentService(id);
    if (!deleted) return res.status(404).json({ message: "Agent not found" });
    res.status(200).json({ message: deleted });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// SHIPPING
export const createShippingController = async (req: Request, res: Response) => {
  try {
        const ship = {
      ...req.body,

      //Convert string to Date
      estimatedDelivery: req.body.estimatedDelivery
        ? new Date(req.body.estimatedDelivery)
        : null,
    };
    const result = await createShippingService(ship);
    res.status(201).json({ message: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getShippingController = async (req: Request, res: Response) => {
  try {
    const shippingRecords = await getShippingService();
    res.status(200).json({ message: "Shipping records retrieved successfully", shippingRecords });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getShippingByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const ship = await getShippingByIdService(id);
    if (!ship) return res.status(404).json({ message: "Shipping record not found" });
    res.status(200).json({ message: "Shipping record retrieved successfully", ship });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateShippingController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const data = { ...req.body };

    if (data.estimatedDelivery) {
      data.estimatedDelivery = new Date(data.estimatedDelivery);
    }

    const updated = await updateShippingService(id, data);

    if (!updated) {
      return res.status(404).json({ message: "Shipping record not found" });
    }

    res.status(200).json({ message: updated });

  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};


export const deleteShippingController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteShippingService(id);
    if (!deleted) return res.status(404).json({ message: "Shipping record not found" });
    res.status(200).json({ message: deleted });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

    if (!shippings.length) {
      return res.status(404).json({ message: "No shippings found with this status" });
    }
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

//Get shippings with related order by agent id
export const getShippingsByAgentIdController = async (req: Request, res: Response) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const shippings = await getShippingsByAgentIdService(agentId);

    if (!shippings.length) {
      return res.status(404).json({ message: "No shippings found for this agent" });
    }

    return res.status(200).json({ shippings });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

//Get shippings with related order by station id
export const getShippingsByStationIdController = async (req: Request, res: Response) => {
  try {
    const stationId = parseInt(req.params.stationId);
    const shippings = await getShippingsByStationIdService(stationId);

    if (!shippings.length) {
      return res.status(404).json({ message: "No shippings found for this station" });
    }

    return res.status(200).json({ shippings });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};