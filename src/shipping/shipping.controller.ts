import { Request, Response } from "express";
import {
  getShippingSettingsService,
  createShippingSettingsService,
  updateShippingSettingsService,
  getShippingDistancesService,
  getShippingDistanceByIdService,
  createShippingDistanceService,
  updateShippingDistanceService,
  deleteShippingDistanceService,
  calculateOrderShipping,
} from "./shipping.service";

// SHIPPING SETTINGS

export const getShippingSettingsController = async (_req: Request, res: Response) => {
  try {
    const settings = await getShippingSettingsService();
    return res.status(200).json({ message: "Shipping settings retrieved", data: settings });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createShippingSettingsController = async (req: Request, res: Response) => {
  try {
    const { price_per_km, price_per_kg, shipping_percentage, vat_percentage } = req.body;

    if (price_per_km === undefined || price_per_kg === undefined || shipping_percentage === undefined) {
      return res.status(400).json({
        message: "price_per_km, price_per_kg, and shipping_percentage are required",
      });
    }

    const created = await createShippingSettingsService({
      price_per_km: String(price_per_km),
      price_per_kg: String(price_per_kg),
      shipping_percentage: Number(shipping_percentage),
      vat_percentage: vat_percentage !== undefined ? Number(vat_percentage) : 16,
    });

    return res.status(201).json({ message: "Shipping settings created", data: created });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateShippingSettingsController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid settings ID" });

    const { price_per_km, price_per_kg, shipping_percentage, vat_percentage } = req.body;

    const updated = await updateShippingSettingsService(id, {
      ...(price_per_km !== undefined && { price_per_km: String(price_per_km) }),
      ...(price_per_kg !== undefined && { price_per_kg: String(price_per_kg) }),
      ...(shipping_percentage !== undefined && { shipping_percentage: Number(shipping_percentage) }),
      ...(vat_percentage !== undefined && { vat_percentage: Number(vat_percentage) }),
    });

    if (!updated) return res.status(404).json({ message: "Shipping settings not found" });

    return res.status(200).json({ message: updated });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// SHIPPING DISTANCES

export const getShippingDistancesController = async (_req: Request, res: Response) => {
  try {
    const distances = await getShippingDistancesService();
    return res.status(200).json({ message: "Shipping distances retrieved", data: distances });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getShippingDistanceByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid distance ID" });

    const distance = await getShippingDistanceByIdService(id);
    if (!distance) return res.status(404).json({ message: "Distance record not found" });

    return res.status(200).json({ message: "Distance retrieved", data: distance });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

const toOptionalNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;

  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export const createShippingDistanceController = async (req: Request, res: Response) => {
  try {
    const { from_station_id, to_station_id, to_agent_id, kilometers } = req.body;

    if (!from_station_id || !kilometers) {
      return res.status(400).json({
        message: "from_station_id and kilometers are required",
      });
    }

    const fromStationId = Number(from_station_id);
    const km = Number(kilometers);

    if (Number.isNaN(fromStationId) || Number.isNaN(km)) {
      return res.status(400).json({
        message: "Invalid numeric values provided",
      });
    }

    const toStationId = toOptionalNumber(to_station_id);
    const toAgentId = toOptionalNumber(to_agent_id);

    if (toStationId === undefined && toAgentId === undefined) {
      return res.status(400).json({
        message: "Either to_station_id or to_agent_id is required",
      });
    }

    if (toStationId !== undefined && toAgentId !== undefined) {
      return res.status(400).json({
        message: "Provide either to_station_id or to_agent_id, not both",
      });
    }

    const created = await createShippingDistanceService({
      from_station_id: fromStationId,
      to_station_id: toStationId,
      to_agent_id: toAgentId,
      kilometers: km.toFixed(2),
    });

    return res.status(201).json({
      message: "Shipping distance created successfully",
      data: created,
    });
  } catch (error: any) {
    console.error("Shipping Controller Error:", error);
    const detail = error.cause?.message || error.detail || error.message;
    return res.status(500).json({ message: error.message, detail });
  }
};

export const updateShippingDistanceController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid distance ID" });
    }

    const {
      from_station_id,
      to_station_id,
      to_agent_id,
      kilometers,
    } = req.body;

    if (to_station_id && to_agent_id) {
      return res.status(400).json({
        message: "Provide either to_station_id or to_agent_id, not both",
      });
    }

    const updatePayload: any = {};
    if (from_station_id !== undefined) updatePayload.from_station_id = Number(from_station_id);
    if (kilometers !== undefined) updatePayload.kilometers = String(kilometers);

    // If to_station_id is provided, set it and clear agent
    if (to_station_id !== undefined && to_station_id !== null && to_station_id !== "") {
      updatePayload.to_station_id = Number(to_station_id);
      updatePayload.to_agent_id = null;
    }
    // If to_agent_id is provided, set it and clear station
    else if (to_agent_id !== undefined && to_agent_id !== null && to_agent_id !== "") {
      updatePayload.to_agent_id = Number(to_agent_id);
      updatePayload.to_station_id = null;
    }

    const updated = await updateShippingDistanceService(id, updatePayload);

    if (!updated) {
      return res.status(404).json({
        message: "Distance record not found",
      });
    }

    return res.status(200).json({
      message: updated,
    });
  } catch (error: any) {
    console.error("Shipping Controller Error:", error);
    const detail = error.cause?.message || error.detail || error.message;
    return res.status(500).json({ message: error.message, detail });
  }
};

export const deleteShippingDistanceController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid distance ID" });

    const deleted = await deleteShippingDistanceService(id);
    if (!deleted) return res.status(404).json({ message: "Distance record not found" });

    return res.status(200).json({ message: deleted });
  } catch (error: any) {
    console.error("Shipping Controller Error:", error);
    const detail = error.cause?.message || error.detail || error.message;
    return res.status(500).json({ message: error.message, detail });
  }
};

// CALCULATE SHIPPING FOR ORDER
export const calculateOrderShippingController = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) return res.status(400).json({ message: "Invalid order ID" });

    const breakdown = await calculateOrderShipping(orderId);
    return res.status(200).json({
      message: "Shipping calculated successfully",
      data: breakdown,
    });
  } catch (error: any) {
    console.error("Shipping Controller Error:", error);
    const detail = error.cause?.message || error.detail || error.message;
    return res.status(500).json({ message: error.message, detail });
  }
};
