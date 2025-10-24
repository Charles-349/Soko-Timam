// import { eq, inArray, isNull, sql } from "drizzle-orm";
// import db from "../Drizzle/db";
// import { TICategory, categories, shops } from "../Drizzle/schema";

// // Create category
// export const createCategoryService = async (category: TICategory) => {
//   await db.insert(categories).values(category);
//   return "Category created successfully";
// };

// // Get category by name
// export const getCategoryByNameService = async (name: string) => {
//   return await db.query.categories.findFirst({
//     where: sql`${categories.name} = ${name}`,
//   });
// };

// //Get all categories
// export const getCategoriesService = async () => {
//   return await db.query.categories.findMany();
// };

// // Get category by ID
// export const getCategoryByIdService = async (id: number) => {
//   return await db.query.categories.findFirst({
//     where: eq(categories.id, id),
//   });
// };

// // Update category
// export const updateCategoryService = async (
//   id: number,
//   category: Partial<TICategory>
// ) => {
//   const updatedCategory = await db
//     .update(categories)
//     .set(category)
//     .where(eq(categories.id, id))
//     .returning();

//   if (updatedCategory.length === 0) {
//     return null;
//   }
//   return "Category updated successfully";
// };

// // Delete category
// export const deleteCategoryService = async (id: number) => {
//   const deletedCategory = await db
//     .delete(categories)
//     .where(eq(categories.id, id))
//     .returning();

//   if (deletedCategory.length === 0) {
//     return null;
//   }
//   return "Category deleted successfully";
// };

// // Category with parent
// export const getCategoryWithParentService = async (id: number) => {
//   return await db.query.categories.findFirst({
//     where: eq(categories.id, id),
//     with: {
//       parent: true,
//     },
//   });
// };

// // Category with children
// export const getCategoryWithChildrenService = async (id: number) => {
//   return await db.query.categories.findFirst({
//     where: eq(categories.id, id),
//     with: {
//       children: true,
//     },
//   });
// };

// // Category with products
// export const getCategoryWithProductsService = async (id: number) => {
//   return await db.query.categories.findFirst({
//     where: eq(categories.id, id),
//     with: {
//       products: true,
//     },
//   });
// };

// // Category with all relations (parent, children, products)
// export const getCategoryWithRelationsService = async (id: number) => {
//   return await db.query.categories.findFirst({
//     where: eq(categories.id, id),
//     with: {
//       parent: true,
//       children: true,
//       products: true,
//     },
//   });
// };

// //Get categories by Shop ID
// export const getCategoriesByShopIdService = async (shopId: number) => {
//   return await db.query.categories.findMany({
//     where: eq(categories.shopId, shopId),
//   });
// };

// //Get categories by Seller ID (supports multiple shops)
// export const getCategoriesBySellerIdService = async (sellerId: number) => {
//   //Finding all shops owned by the seller
//   const sellerShops = await db.query.shops.findMany({
//     where: eq(shops.sellerId, sellerId),
//   });

//   if (sellerShops.length === 0) {
//     return [];
//   }

//   //Extracting all shop IDs
//   const shopIds = sellerShops.map((shop) => shop.id);

//   //Fetching all categories belonging to those shop IDs
//   const sellerCategories = await db.query.categories.findMany({
//     where: inArray(categories.shopId, shopIds),
//   });

//   return sellerCategories;
// };

// //get categories for a specific seller in a specific shop
// export const getCategoriesBySellerAndShopIdService = async (
//   sellerId: number,
//   shopId: number
// ) => {
//   //Verify the shop belongs to the seller
//   const shop = await db.query.shops.findFirst({
//     where: eq(shops.id, shopId),
//   });

//   if (!shop || shop.sellerId !== sellerId) {
//     return [];
//   }

//   //Fetch categories for the specified shop
//   const categoriesInShop = await db.query.categories.findMany({
//     where: eq(categories.shopId, shopId),
//   });

//   return categoriesInShop;
// };








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

//Get Categories by Shop ID
export const getCategoriesByShopIdService = async (shopId: number) => {
  return await db.query.categories.findMany({
    where: eq(categories.shopId, shopId),
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
};

//Get Categories by Seller ID (across all shops)
export const getCategoriesBySellerIdService = async (sellerId: number) => {
  const sellerShops = await db.query.shops.findMany({
    where: eq(shops.sellerId, sellerId),
  });

  if (sellerShops.length === 0) return [];

  const shopIds = sellerShops.map((s) => s.id);

  return await db.query.categories.findMany({
    where: inArray(categories.shopId, shopIds),
  });
};

// Get Categories for a specific Seller in a specific Shop
export const getCategoriesBySellerAndShopIdService = async (
  sellerId: number,
  shopId: number
) => {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, shopId),
  });

  if (!shop || shop.sellerId !== sellerId) return [];

  return await db.query.categories.findMany({
    where: eq(categories.shopId, shopId),
  });
};

