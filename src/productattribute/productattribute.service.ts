import { eq } from "drizzle-orm";
import db from "../Drizzle/db";
import {
  TIProductAttribute,
  productAttributes,
  products,
} from "../Drizzle/schema";

// Create Product Attribute
export const createProductAttributeService = async (
  attribute: TIProductAttribute
) => {
  await db.insert(productAttributes).values(attribute);
  return "Product attribute created successfully";
};

// Get All Product Attributes
export const getProductAttributesService = async () => {
  return await db.query.productAttributes.findMany();
};

// Get Product Attribute by ID
export const getProductAttributeByIdService = async (id: number) => {
  return await db.query.productAttributes.findFirst({
    where: eq(productAttributes.id, id),
  });
};

// Get Product Attributes by Product ID
export const getAttributesByProductIdService = async (productId: number) => {
  return await db.query.productAttributes.findMany({
    where: eq(productAttributes.productId, productId),
  });
};

// Update Product Attribute
export const updateProductAttributeService = async (
  id: number,
  attribute: Partial<TIProductAttribute>
) => {
  const updatedAttribute = await db
    .update(productAttributes)
    .set(attribute)
    .where(eq(productAttributes.id, id))
    .returning();

  if (updatedAttribute.length === 0) {
    return null;
  }
  return "Product attribute updated successfully";
};

// Delete Product Attribute
export const deleteProductAttributeService = async (id: number) => {
  const deletedAttribute = await db
    .delete(productAttributes)
    .where(eq(productAttributes.id, id))
    .returning();

  if (deletedAttribute.length === 0) {
    return null;
  }
  return "Product attribute deleted successfully";
};

// Product Attribute with Product Details
export const getProductAttributeWithProductService = async (id: number) => {
  return await db.query.productAttributes.findFirst({
    where: eq(productAttributes.id, id),
    with: {
      product: true,
    },
  });
};
