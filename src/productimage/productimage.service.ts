import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { TIProductImage, productImages, products } from "../Drizzle/schema";

// Create Product Image
export const createProductImageService = async (image: TIProductImage) => {
  await db.insert(productImages).values(image);
  return "Product image created successfully";
};

// Get All Product Images
export const getProductImagesService = async () => {
  return await db.query.productImages.findMany();
};

// Get Product Image by ID
export const getProductImageByIdService = async (id: number) => {
  return await db.query.productImages.findFirst({
    where: eq(productImages.id, id),
  });
};

// Get Product Images by Product ID
export const getImagesByProductIdService = async (productId: number) => {
  return await db.query.productImages.findMany({
    where: eq(productImages.productId, productId),
  });
};

// Update Product Image
export const updateProductImageService = async (
  id: number,
  image: Partial<TIProductImage>
) => {
  const updatedImage = await db
    .update(productImages)
    .set(image)
    .where(eq(productImages.id, id))
    .returning();

  if (updatedImage.length === 0) {
    return null;
  }
  return "Product image updated successfully";
};

// Delete Product Image
export const deleteProductImageService = async (id: number) => {
  const deletedImage = await db
    .delete(productImages)
    .where(eq(productImages.id, id))
    .returning();

  if (deletedImage.length === 0) {
    return null;
  }
  return "Product image deleted successfully";
};

// Product Image with Product Details
export const getProductImageWithProductService = async (id: number) => {
  return await db.query.productImages.findFirst({
    where: eq(productImages.id, id),
    with: { product: true },
  });
};

// Product with All Images
export const getProductWithImagesService = async (productId: number) => {
  return await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: { images: true },
  });
};
