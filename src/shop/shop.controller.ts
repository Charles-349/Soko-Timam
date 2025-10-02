import { Request, Response } from "express";
import {
  createShopService,
  getAllShopsService,
  getShopByIdService,
  getShopsByOwnerService,
  updateShopService,
  deleteShopService,
  getShopWithProductsService,
  getShopWithOrdersService,
} from "../shop/shop.service";

// CREATE 
export const createShopController = async (req: Request, res: Response) => {
  try {
    const shop = await createShopService(req.body);
    return res.status(201).json({
      message: "Shop created successfully",
      shop,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

//READ ALL 
export const getAllShopsController = async (req: Request, res: Response) => {
  try {
    const shops = await getAllShopsService();
    return res.status(200).json({
      message: "Shops retrieved successfully",
      shops,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

//READ ONE 
export const getShopByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopByIdService(id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    return res
      .status(200)
      .json({ message: "Shop retrieved successfully", shop });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// READ BY OWNER
export const getShopsByOwnerController = async (req: Request, res: Response) => {
  try {
    const ownerId = parseInt(req.params.ownerId);
    if (!ownerId)
      return res.status(400).json({ message: "Invalid owner ID" });

    const shops = await getShopsByOwnerService(ownerId);
    return res.status(200).json({
      message: "Shops retrieved successfully for owner",
      shops,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateShopController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const updatedShop = await updateShopService(id, req.body);
    if (!updatedShop)
      return res.status(404).json({ message: "Shop not found" });

    return res
      .status(200)
      .json({ message: "Shop updated successfully", shop: updatedShop });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteShopController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const deletedShop = await deleteShopService(id);
    if (!deletedShop)
      return res.status(404).json({ message: "Shop not found" });

    return res
      .status(200)
      .json({ message: "Shop deleted successfully", shop: deletedShop });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// RELATIONS

// Shop with Products
export const getShopWithProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopWithProductsService(id);
    if (!shop)
      return res.status(404).json({ message: "Shop or products not found" });

    return res.status(200).json({
      message: "Shop with products retrieved successfully",
      shop,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Shop with Orders
export const getShopWithOrdersController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopWithOrdersService(id);
    if (!shop)
      return res.status(404).json({ message: "Shop or orders not found" });

    return res.status(200).json({
      message: "Shop with orders retrieved successfully",
      shop,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
