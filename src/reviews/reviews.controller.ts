import { Request, Response } from "express";
import {
  createReviewService,
  deleteReviewService,
  updateReviewService,
  getReviewByIdService,
  getReviewsService,
  getReviewsByProductService,
  getReviewsByUserService,
} from "./reviews.service";

// Create Review
export const createReviewController = async (req: Request, res: Response) => {
  try {
    const review = req.body;

    if (!review.rating || review.rating < 1 || review.rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const createdReview = await createReviewService(review);
    return res
      .status(201)
      .json({ message: "Review created successfully", review: createdReview });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all Reviews
export const getReviewsController = async (req: Request, res: Response) => {
  try {
    const reviews = await getReviewsService();
    return res
      .status(200)
      .json({ message: "Reviews retrieved successfully", reviews });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Review by ID
export const getReviewByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const review = await getReviewByIdService(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    return res
      .status(200)
      .json({ message: "Review retrieved successfully", review });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update Review
export const updateReviewController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedReview = await updateReviewService(id, req.body);
    if (!updatedReview)
      return res.status(404).json({ message: "Review not found" });
    return res.status(200).json({ message: "Review updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Review
export const deleteReviewController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedReview = await deleteReviewService(id);
    if (!deletedReview)
      return res.status(404).json({ message: "Review not found" });
    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Reviews by Product
export const getReviewsByProductController = async (
  req: Request,
  res: Response
) => {
  try {
    const productId = parseInt(req.params.productId);
    const reviews = await getReviewsByProductService(productId);
    return res.status(200).json({
      message: "Reviews for product retrieved successfully",
      reviews,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Reviews by User
export const getReviewsByUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = parseInt(req.params.userId);
    const reviews = await getReviewsByUserService(userId);
    return res.status(200).json({
      message: "Reviews by user retrieved successfully",
      reviews,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
