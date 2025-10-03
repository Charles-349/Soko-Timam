import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { TIReview, reviews } from "../Drizzle/schema";

// Create review
export const createReviewService = async (review: TIReview) => {
  await db.insert(reviews).values(review);
  return "Review created successfully";
};

// Get all reviews
export const getReviewsService = async () => {
  return await db.query.reviews.findMany({
    with: { product: true, user: true },
  });
};

// Get review by ID
export const getReviewByIdService = async (id: number) => {
  return await db.query.reviews.findFirst({
    where: eq(reviews.id, id),
    with: { product: true, user: true },
  });
};

// Update review
export const updateReviewService = async (
  id: number,
  review: Partial<TIReview>
) => {
  const updatedReview = await db
    .update(reviews)
    .set(review)
    .where(eq(reviews.id, id))
    .returning();

  if (updatedReview.length === 0) {
    return null;
  }
  return "Review updated successfully";
};

// Delete review
export const deleteReviewService = async (id: number) => {
  const deletedReview = await db
    .delete(reviews)
    .where(eq(reviews.id, id))
    .returning();

  if (deletedReview.length === 0) {
    return null;
  }
  return "Review deleted successfully";
};

// Get reviews by product
export const getReviewsByProductService = async (productId: number) => {
  return await db.query.reviews.findMany({
    where: eq(reviews.productId, productId),
    with: { user: true },
  });
};

// Get reviews by user
export const getReviewsByUserService = async (userId: number) => {
  return await db.query.reviews.findMany({
    where: eq(reviews.userId, userId),
    with: { product: true },
  });
};
