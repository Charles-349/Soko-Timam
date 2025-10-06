import { Request, Response } from "express";
import {
  createProductAttributeService,
  getProductAttributesService,
  getProductAttributeByIdService,
  getAttributesByProductIdService,
  updateProductAttributeService,
  deleteProductAttributeService,
  getProductAttributeWithProductService,
} from "./productattribute.service";

// CREATE
export const createProductAttributeController = async (
  req: Request,
  res: Response
) => {
  try {
    const attribute = req.body;
    await createProductAttributeService(attribute);
    return res.status(201).json({
      message: "Product attribute created successfully",
      attribute,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// READ
export const getProductAttributesController = async (
  req: Request,
  res: Response
) => {
  try {
    const attributes = await getProductAttributesService();
    return res.status(200).json({
      message: "Product attributes retrieved successfully",
      attributes,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProductAttributeByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const attribute = await getProductAttributeByIdService(id);
    if (!attribute)
      return res.status(404).json({ message: "Product attribute not found" });
    return res.status(200).json({
      message: "Product attribute retrieved successfully",
      attribute,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAttributesByProductIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const productId = parseInt(req.params.productId);
    const attributes = await getAttributesByProductIdService(productId);
    return res.status(200).json({
      message: "Attributes for product retrieved successfully",
      attributes,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateProductAttributeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const updatedAttribute = await updateProductAttributeService(id, req.body);
    if (!updatedAttribute)
      return res.status(404).json({ message: "Product attribute not found" });
    return res
      .status(200)
      .json({ message: "Product attribute updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteProductAttributeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const deletedAttribute = await deleteProductAttributeService(id);
    if (!deletedAttribute)
      return res.status(404).json({ message: "Product attribute not found" });
    return res
      .status(200)
      .json({ message: "Product attribute deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// RELATIONS
export const getProductAttributeWithProductController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    const attributeWithProduct = await getProductAttributeWithProductService(id);
    if (!attributeWithProduct)
      return res.status(404).json({ message: "Product attribute not found" });
    return res.status(200).json({
      message: "Product attribute with product retrieved successfully",
      data: attributeWithProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
