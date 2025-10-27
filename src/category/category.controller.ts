
import { Request, Response } from "express";
import {
  createCategoryService,
  getCategoriesService,
  getCategoryByIdService,
  getCategoryByNameService,
  updateCategoryService,
  deleteCategoryService,
  getCategoryWithParentService,
  getCategoryWithChildrenService,
  getCategoryWithProductsService,
  getCategoryWithRelationsService,
} from "./category.service";

// CREATE
export const createCategoryController = async (req: Request, res: Response) => {
  try {
    const category = req.body;

    if (!category.name || category.name.trim().length === 0) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existingCategory = await getCategoryByNameService(category.name);
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = await createCategoryService(category);
    return res
      .status(201)
      .json({ message: "Category created successfully", category: newCategory });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// READ ALL
export const getCategoriesController = async (_req: Request, res: Response) => {
  try {
    const categories = await getCategoriesService();
    return res.status(200).json({
      message: "Categories retrieved successfully",
      categories,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// READ ONE
export const getCategoryByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await getCategoryByIdService(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category retrieved successfully",
      category,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateCategoryController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const updatedCategory = await updateCategoryService(id, req.body);
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteCategoryController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const deletedCategory = await deleteCategoryService(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category deleted successfully",
      category: deletedCategory,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Category with Parent
export const getCategoryWithParentController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const category = await getCategoryWithParentService(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category with parent retrieved successfully",
      category,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Category with Children
export const getCategoryWithChildrenController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const category = await getCategoryWithChildrenService(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category with children retrieved successfully",
      category,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Category with Products
export const getCategoryWithProductsController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const category = await getCategoryWithProductsService(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category with products retrieved successfully",
      category,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Category with All Relations
export const getCategoryWithRelationsController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const category = await getCategoryWithRelationsService(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category with all relations retrieved successfully",
      category,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};


