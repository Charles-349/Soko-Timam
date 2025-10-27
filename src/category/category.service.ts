
import { eq, inArray, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { TICategory, categories, shops } from "../Drizzle/schema";

//Create Category
export const createCategoryService = async (category: TICategory) => {
  const [newCategory] = await db.insert(categories).values(category).returning();
  return newCategory;
};

//Get Category by Name
export const getCategoryByNameService = async (name: string) => {
  return await db.query.categories.findFirst({
    where: sql`${categories.name} = ${name}`,
  });
};

// Get All Categories
export const getCategoriesService = async () => {
  return await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.id)],
  });
};

// Get Category by ID
export const getCategoryByIdService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
};

// Update Category
export const updateCategoryService = async (
  id: number,
  category: Partial<TICategory>
) => {
  const [updatedCategory] = await db
    .update(categories)
    .set(category)
    .where(eq(categories.id, id))
    .returning();

  return updatedCategory || null;
};

// Delete Category
export const deleteCategoryService = async (id: number) => {
  const [deletedCategory] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();

  return deletedCategory || null;
};

// Get Category with Parent
export const getCategoryWithParentService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      parent: true,
    },
  });
};

// Get Category with Children
export const getCategoryWithChildrenService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      children: true,
    },
  });
};

//Get Category with Products
export const getCategoryWithProductsService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      products: true,
    },
  });
};

// Get Category with All Relations (parent, children, products)
export const getCategoryWithRelationsService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      parent: true,
      children: true,
      products: true,
    },
  });
};
