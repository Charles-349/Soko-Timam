import { Request, Response } from "express";
import {
  createCartService,
  getCartsService,
  getCartByIdService,
  updateCartService,
  deleteCartService,
  addCartItemService,
  updateCartItemService,
  removeCartItemService,
  getCartWithItemsService,
  getCartsWithItemsService,
} from "./cart.service";

// Create Cart
export const createCartController = async (req: Request, res: Response) => {
  try {
    await createCartService(req.body);
    return res.status(201).json({ message: "Cart created successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get All Carts
export const getCartsController = async (req: Request, res: Response) => {
  try {
    const carts = await getCartsService();
    return res.status(200).json({ message: "Carts retrieved successfully", carts });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Cart by ID
export const getCartByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const cart = await getCartByIdService(id);
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    return res.status(200).json({ message: "Cart retrieved successfully", cart });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update Cart
export const updateCartController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedCart = await updateCartService(id, req.body);
    if (!updatedCart) return res.status(404).json({ message: "Cart not found" });
    return res.status(200).json({ message: "Cart updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Cart
export const deleteCartController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedCart = await deleteCartService(id);
    if (!deletedCart) return res.status(404).json({ message: "Cart not found" });
    return res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Add Item to Cart
export const addCartItemController = async (req: Request, res: Response) => {
  try {
    const { cartId, productId, quantity } = req.body;
    await addCartItemService(cartId, productId, quantity);
    return res.status(201).json({ message: "Item added to cart successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update Cart Item
export const updateCartItemController = async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;
    const updatedItem = await updateCartItemService(itemId, quantity);
    if (!updatedItem) return res.status(404).json({ message: "Cart item not found" });
    return res.status(200).json({ message: "Cart item updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Remove Cart Item
export const removeCartItemController = async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const deletedItem = await removeCartItemService(itemId);
    if (!deletedItem) return res.status(404).json({ message: "Cart item not found" });
    return res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};


// Get Cart with Items
export const getCartWithItemsController = async (req: Request, res: Response) => {
  try {
    const cartId = parseInt(req.params.id);
    const cart = await getCartWithItemsService(cartId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    return res.status(200).json({ message: "Cart with items retrieved successfully", cart });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get All Carts with Items
export const getCartsWithItemsController = async (req: Request, res: Response) => {
  try {
    const carts = await getCartsWithItemsService();
    return res.status(200).json({ message: "Carts with items retrieved successfully", carts });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
