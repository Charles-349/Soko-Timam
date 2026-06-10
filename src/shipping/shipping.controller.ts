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

export const createShippingDistanceController = async (req: Request, res: Response) => {
  try {
    const { from_station_id, to_station_id, to_agent_id, kilometers } = req.body;

    if (!from_station_id || (!to_station_id && !to_agent_id) || !kilometers) {
      return res.status(400).json({
        message: "from_station_id, kilometers, and either to_station_id or to_agent_id are required",
      });
    }

    const created = await createShippingDistanceService({
      from_station_id: Number(from_station_id),
      to_station_id: to_station_id ? Number(to_station_id) : undefined,
      to_agent_id: to_agent_id ? Number(to_agent_id) : undefined,
      kilometers: String(kilometers),
    });

    return res.status(201).json({
      message: "Shipping distance created (cost auto-calculated)",
      data: created,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateShippingDistanceController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid distance ID" });

    const { from_station_id, to_station_id, to_agent_id, kilometers } = req.body;
    const updated = await updateShippingDistanceService(id, {
      ...(from_station_id !== undefined && { from_station_id: Number(from_station_id) }),
      ...(to_station_id !== undefined && { to_station_id: to_station_id === null ? null : Number(to_station_id) }),
      ...(to_agent_id !== undefined && { to_agent_id: to_agent_id === null ? null : Number(to_agent_id) }),
      ...(kilometers !== undefined && { kilometers: String(kilometers) }),
    });

    if (!updated) return res.status(404).json({ message: "Distance record not found" });

    return res.status(200).json({ message: updated });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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
    return res.status(500).json({ message: error.message });
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
    return res.status(500).json({ message: error.message });
  }
};
