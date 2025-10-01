import { Request, Response } from "express";
import {
  createProductService,
  getProductByIdService,
  getAllProductsService,
  updateProductService,
  deleteProductService,
  getProductWithCategoryService,
  getProductWithReviewsService,
  getProductWithWishlistService,
  getProductWithCartService,
  getProductWithOrdersService,
} from "./product.service";

// Helper: Parse int safely 
const toInt = (val: any, fallback?: number): number | undefined => {
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
};

// Create Product
export const createProductController = async (req: Request, res: Response) => {
  try {
    const product = await createProductService(req.body);
    return res
      .status(201)
      .json({ message: "Product created successfully", product });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to create product",
      error: error.stack,
    });
  }
};

// Get All Products (with filters & pagination)
export const getProductsController = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, shopId, limit, offset, sortBy, order } =
      req.query;

    const result = await getAllProductsService({
      search: search as string,
      categoryId: toInt(categoryId),
      shopId: toInt(shopId),
      limit: toInt(limit, 20),
      offset: toInt(offset, 0),
      sortBy: sortBy as
        | "createdAt"
        | "price"
        | "rating"
        | "salesCount"
        | undefined,
      order: order as "asc" | "desc" | undefined,
    });

    return res.status(200).json({
      message: "Products retrieved successfully",
      ...result, // { total, limit, offset, products }
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch products",
      error: error.stack,
    });
  }
};

// Get Product by ID
export const getProductByIdController = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const product = await getProductByIdService(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res
      .status(200)
      .json({ message: "Product retrieved successfully", product });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch product",
      error: error.stack,
    });
  }
};

// Update Product
export const updateProductController = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const updatedProduct = await updateProductService(id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to update product",
      error: error.stack,
    });
  }
};

// Delete Product
export const deleteProductController = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const deleted = await deleteProductService(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to delete product",
      error: error.stack,
    });
  }
};

// Product with Category
export const getProductWithCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const product = await getProductWithCategoryService(id);
    if (!product) {
      return res.status(404).json({ message: "Product or category not found" });
    }
    return res.status(200).json({
      message: "Product with category retrieved successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch product with category",
      error: error.stack,
    });
  }
};

// Product with Reviews
export const getProductWithReviewsController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const product = await getProductWithReviewsService(id);
    if (!product) {
      return res.status(404).json({ message: "Product or reviews not found" });
    }
    return res.status(200).json({
      message: "Product with reviews retrieved successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch product with reviews",
      error: error.stack,
    });
  }
};

// Product with Wishlist
export const getProductWithWishlistController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const product = await getProductWithWishlistService(id);
    if (!product) {
      return res.status(404).json({ message: "Product or wishlist not found" });
    }
    return res.status(200).json({
      message: "Product with wishlist retrieved successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch product with wishlist",
      error: error.stack,
    });
  }
};

// Product with Cart
export const getProductWithCartController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const product = await getProductWithCartService(id);
    if (!product) {
      return res.status(404).json({ message: "Product or cart not found" });
    }

    // Flatten cart response
    const carts = product.cartItems?.map((ci) => ({
      cartId: ci.cart.id,
      user: ci.cart.user,
      items: ci.cart.items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    }));

    return res.status(200).json({
      message: "Product with cart retrieved successfully",
      product: { ...product, carts },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch product with cart",
      error: error.stack,
    });
  }
};

// Product with Orders
export const getProductWithOrdersController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid product ID" });

    const product = await getProductWithOrdersService(id);
    if (!product) {
      return res.status(404).json({ message: "Product or orders not found" });
    }

    const orders = product.orderItems?.map((oi) => ({
      orderId: oi.order.id,
      user: oi.order.user,
      items: oi.order.items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
      payments: oi.order.payments,
      shipping: oi.order.shipping,
    }));

    return res.status(200).json({
      message: "Product with orders retrieved successfully",
      product: { ...product, orders },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch product with orders",
      error: error.stack,
    });
  }
};
