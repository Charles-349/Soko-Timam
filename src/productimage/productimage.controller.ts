import { Request, Response } from "express";
import {
  createProductImageService,
  getProductImagesService,
  getProductImageByIdService,
  getImagesByProductIdService,
  updateProductImageService,
  deleteProductImageService,
  getProductImageWithProductService,
  getProductWithImagesService,
} from "./productimage.service";

// CREATE
export const createProductImageController = async (req: Request, res: Response) => {
  try {
    const image = req.body;
    const created = await createProductImageService(image);
    return res
      .status(201)
      .json({ message: "Product image created successfully", image: created });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// READ
export const getProductImagesController = async (req: Request, res: Response) => {
  try {
    const images = await getProductImagesService();
    return res
      .status(200)
      .json({ message: "Product images retrieved successfully", images });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProductImageByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const image = await getProductImageByIdService(id);
    if (!image) return res.status(404).json({ message: "Product image not found" });
    return res
      .status(200)
      .json({ message: "Product image retrieved successfully", image });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getImagesByProductIdController = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const images = await getImagesByProductIdService(productId);
    return res
      .status(200)
      .json({ message: "Images for product retrieved successfully", images });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateProductImageController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedImage = await updateProductImageService(id, req.body);
    if (!updatedImage) return res.status(404).json({ message: "Product image not found" });
    return res.status(200).json({ message: "Product image updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE 
export const deleteProductImageController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedImage = await deleteProductImageService(id);
    if (!deletedImage) return res.status(404).json({ message: "Product image not found" });
    return res.status(200).json({ message: "Product image deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// RELATIONS
export const getProductImageWithProductController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const imageWithProduct = await getProductImageWithProductService(id);
    if (!imageWithProduct)
      return res.status(404).json({ message: "Product image not found" });
    return res.status(200).json({
      message: "Product image with product retrieved successfully",
      data: imageWithProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProductWithImagesController = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const productWithImages = await getProductWithImagesService(productId);
    if (!productWithImages)
      return res.status(404).json({ message: "Product not found" });
    return res.status(200).json({
      message: "Product with images retrieved successfully",
      data: productWithImages,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
