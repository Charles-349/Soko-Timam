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
  getProductsByCategoryIdService,
} from "./product.service";
import type { ICreateProductInput } from "./product.service";
import Jwt from "jsonwebtoken";

// Helper: Parse int safely 
const toInt = (val: any, fallback?: number): number | undefined => {
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    const userId = decoded.id;

    // Extract product data from body
    const { shopId, categoryId, name, description, price, stock, sku, status } = req.body;

    if (!shopId || !categoryId || !name || !price) {
      return res.status(400).json({
        message: "Missing required fields: shopId, categoryId, name, and price",
      });
    }

    // Extract images from multer
    const files = req.files as { images?: Express.Multer.File[] };

    // Build product input object
    const productData: ICreateProductInput = {
      shopId: Number(shopId),
      categoryId: Number(categoryId),
      name,
      description,
      price: Number(price),
      stock: stock ? Number(stock) : 0,
      imageFiles: files?.images,
    };

    // Call service
    const newProduct = await createProductService(productData);

    // Send success response
    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: error.message || "Failed to create product",
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
        // | "rating"
        // | "salesCount"
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

//get product by category id
export const getProductsByCategoryIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const categoryId = toInt(req.params.categoryId);
    if (!categoryId) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const products = await getProductsByCategoryIdService(categoryId);
    return res.status(200).json({
      message: "Products retrieved successfully",
      products,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch products by category",
      error: error.stack,
    });
  }
};
