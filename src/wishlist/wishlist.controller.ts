import { Request, Response } from "express";
import {
  createWishlistService,
  deleteWishlistService,
  updateWishlistService,
  getWishlistByIdService,
  getWishlistsService,
  getWishlistWithUserService,
  getWishlistWithProductService,
  getWishlistsByUserService,
} from "./wishlist.service";

// Create Wishlist Item
export const createWishlistController = async (req: Request, res: Response) => {
  try {
    const wishlist = req.body;
    await createWishlistService(wishlist);
    return res
      .status(201)
      .json({ message: "Wishlist item created successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get All Wishlist Items
export const getWishlistsController = async (req: Request, res: Response) => {
  try {
    const wishlists = await getWishlistsService();
    return res.status(200).json({
      message: "Wishlists retrieved successfully",
      data: wishlists,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Wishlist by ID
export const getWishlistByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const wishlist = await getWishlistByIdService(id);
    if (!wishlist)
      return res.status(404).json({ message: "Wishlist item not found" });
    return res.status(200).json({
      message: "Wishlist retrieved successfully",
      data: wishlist,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update Wishlist Item
export const updateWishlistController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedWishlist = await updateWishlistService(id, req.body);
    if (!updatedWishlist)
      return res.status(404).json({ message: "Wishlist item not found" });
    return res
      .status(200)
      .json({ message: "Wishlist updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Wishlist Item
export const deleteWishlistController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedWishlist = await deleteWishlistService(id);
    if (!deletedWishlist)
      return res.status(404).json({ message: "Wishlist item not found" });
    return res
      .status(200)
      .json({ message: "Wishlist item deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Wishlist with User
export const getWishlistWithUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const wishlist = await getWishlistWithUserService(id);
    return res.status(200).json({
      message: "Wishlist with user retrieved successfully",
      data: wishlist,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Wishlist with Product
export const getWishlistWithProductController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const wishlist = await getWishlistWithProductService(id);
    return res.status(200).json({
      message: "Wishlist with product retrieved successfully",
      data: wishlist,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Wishlist by User (all products saved by user)
export const getWishlistsByUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = parseInt(req.params.userId);
    const wishlists = await getWishlistsByUserService(userId);
    return res.status(200).json({
      message: "User's wishlist retrieved successfully",
      data: wishlists,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
