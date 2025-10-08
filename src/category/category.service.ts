import { eq, isNull, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { TICategory, categories } from "../Drizzle/schema";

// Create category
export const createCategoryService = async (category: TICategory) => {
  await db.insert(categories).values(category);
  return "Category created successfully";
};

// Get category by name
export const getCategoryByNameService = async (name: string) => {
  return await db.query.categories.findFirst({
    where: sql`${categories.name} = ${name}`,
  });
};

//Get all categories
export const getCategoriesService = async () => {
  return await db.query.categories.findMany();
};
//get main categories only
// export const getMainCategoriesService = async () => {
//   try {
//     const mainCategories = await db
//       .select()
//       .from(categories)
//       .where(isNull(categories.parentId));

//     return mainCategories;
//   } catch (error: any) {
//     console.error("Error fetching main categories:", error);
//     throw new Error("Failed to fetch main categories");
//   }
// };                                                      
   

//   //fetch subcategories by parent id
// export const getSubCategoriesByParentIdService = async (parentId: number) => {
//   const subCategories = await db.query.categories.findMany({
//     where:(c) => eq(c.parentId, parentId),
//   });
//   return subCategories;
// }

// Get category by ID
export const getCategoryByIdService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
};

// Update category
export const updateCategoryService = async (
  id: number,
  category: Partial<TICategory>
) => {
  const updatedCategory = await db
    .update(categories)
    .set(category)
    .where(eq(categories.id, id))
    .returning();

  if (updatedCategory.length === 0) {
    return null;
  }
  return "Category updated successfully";
};

// Delete category
export const deleteCategoryService = async (id: number) => {
  const deletedCategory = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();

  if (deletedCategory.length === 0) {
    return null;
  }
  return "Category deleted successfully";
};

// Category with parent
export const getCategoryWithParentService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      parent: true,
    },
  });
};

// Category with children
export const getCategoryWithChildrenService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      children: true,
    },
  });
};

// Category with products
export const getCategoryWithProductsService = async (id: number) => {
  return await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      products: true,
    },
  });
};

// Category with all relations (parent, children, products)
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
