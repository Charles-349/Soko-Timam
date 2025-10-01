
import { eq, sql, and, like, desc, asc, count } from "drizzle-orm";
import db from "../Drizzle/db";
import {
  products,
  type TIProduct,
  type TSProduct,
} from "../Drizzle/schema";

// Create a new product
export const createProductService = async (data: TIProduct) => {
  try {
    const [newProduct] = await db.insert(products).values(data).returning();
    return newProduct as TSProduct;
  } catch (err) {
    throw new Error("Failed to create product: " + (err as Error).message);
  }
};

// Get single product by ID
export const getProductByIdService = async (id: number) => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    return (product as TSProduct) || null;
  } catch (err) {
    throw new Error("Failed to fetch product: " + (err as Error).message);
  }
};

// Get all products with optional filters + pagination
export const getAllProductsService = async (params?: {
  search?: string;
  categoryId?: number;
  shopId?: number;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "price" | "rating" | "salesCount";
  order?: "asc" | "desc";
}) => {
  try {
    const {
      search,
      categoryId,
      shopId,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      order = "desc",
    } = params || {};

    const whereClauses = [];

    if (search) {
      whereClauses.push(like(products.name, `%${search}%`));
    }
    if (categoryId) {
      whereClauses.push(eq(products.categoryId, categoryId));
    }
    if (shopId) {
      whereClauses.push(eq(products.shopId, shopId));
    }

    const condition = whereClauses.length ? and(...whereClauses) : undefined;

    // Map sort keys explicitly to prevent SQL injection
    const sortColumn = {
      createdAt: products.createdAt,
      price: products.price,
      rating: products.rating,
      salesCount: products.salesCount,
    }[sortBy];

    const orderBy = order === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Fetch total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(condition || sql`true`);

    // Fetch paginated results
    const result = await db.query.products.findMany({
      where: condition,
      orderBy,
      limit,
      offset,
    });

    return {
      total,
      limit,
      offset,
      products: result as TSProduct[],
    };
  } catch (err) {
    throw new Error("Failed to fetch products: " + (err as Error).message);
  }
};

// Update product
export const updateProductService = async (
  id: number,
  updates: Partial<TIProduct>
) => {
  try {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return (updatedProduct as TSProduct) || null;
  } catch (err) {
    throw new Error("Failed to update product: " + (err as Error).message);
  }
};

// Delete product
export const deleteProductService = async (id: number) => {
  try {
    const deleted = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    return deleted.length > 0;
  } catch (err) {
    throw new Error("Failed to delete product: " + (err as Error).message);
  }
};

// Product with Category
export const getProductWithCategoryService = async (id: number) => {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { category: true },
  });
};

// Product with Reviews
export const getProductWithReviewsService = async (id: number) => {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      reviews: {
        with: { user: true },
      },
    },
  });
};

// Product with Wishlist
export const getProductWithWishlistService = async (id: number) => {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      wishlists: { with: { user: true } },
    },
  });
};

// Product with Cart (via cartItems → cart → user)
export const getProductWithCartService = async (id: number) => {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      cartItems: {
        with: {
          cart: {
            with: {
              user: true,
              items: {
                with: {
                  product: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

// Product with Orders (via orderItems → order → user/payments/shipping)
export const getProductWithOrdersService = async (id: number) => {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      orderItems: {
        with: {
          order: {
            with: {
              user: true,
              items: {
                with: {
                  product: true,
                },
              },
              payments: true,
              shipping: true,
            },
          },
        },
      },
    },
  });
};
