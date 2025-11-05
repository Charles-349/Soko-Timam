
import { eq, sql, and, like, desc, asc, count ,isNull, or, gt, lt,} from "drizzle-orm";
import db from "../Drizzle/db";
import {
  products,
  type TIProduct,
  type TSProduct,
  productImages,
  flashSales,
} from "../Drizzle/schema";
import type { Express } from "express";
import { uploadToCloudinary } from "../utils/upload";

// Create a new product
export interface ICreateProductInput {
  shopId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageFiles?: Express.Multer.File[]; // multiple files
}

export const createProductService = async (data: ICreateProductInput) => {
  // Insert product first
  const insertedProducts = await db
    .insert(products)
    .values({
      shopId: data.shopId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price.toString(),
      stock: data.stock ?? 0,
      // sku: data.sku,
      // status: data.status ?? "active",
    })
    .returning();

  const newProduct = insertedProducts[0];

  // Handle multiple image uploads
  if (data.imageFiles && data.imageFiles.length > 0) {
    const uploadedImages = await Promise.all(
      data.imageFiles.map(file => uploadToCloudinary(file))
    );

    // Insert uploaded images into productImages table
    const imageInserts = uploadedImages.map((url, index) => ({
      productId: newProduct.id,
      imageUrl: url,
      isMain: index === 0, // first image as main
    }));

    await db.insert(productImages).values(imageInserts);
  }

  // return product with images
  const productWithImages = await db.query.products.findFirst({
     where: eq(products.id, newProduct.id),
    with: { images: true },
  });

  return productWithImages;
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

    const now = new Date();
    const whereClauses: (ReturnType<typeof eq> | ReturnType<typeof like>)[] = [];

    if (search) {
      whereClauses.push(like(products.name, `%${search}%`));
    }
    if (categoryId) {
      whereClauses.push(eq(products.categoryId, categoryId));
    }
    if (shopId) {
      whereClauses.push(eq(products.shopId, shopId));
    }

    const baseCondition = whereClauses.length ? and(...whereClauses) : sql`true`;

    //Exclude products that are in active or upcoming flash sales
    const filteredCondition = and(
      baseCondition,
      or(
        isNull(flashSales.productId), // not in flash sale
        lt(flashSales.endTime, now)  // flash sale already ended (time passed)
      )
    );

    // Map sort keys explicitly
    const sortColumn = {
      createdAt: products.createdAt,
      price: products.price,
      // rating: products.rating,
      // salesCount: products.salesCount,
    }[sortBy];

    const orderBy = order === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Fetch total count (excluding flash sale products)
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .leftJoin(flashSales, eq(products.id, flashSales.productId))
      .where(filteredCondition);

    // Fetch paginated products (excluding flash sale ones)
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        imageUrl: products.ImageUrl,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(flashSales, eq(products.id, flashSales.productId))
      .where(filteredCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      total,
      limit,
      offset,
      products: result as unknown as TSProduct[],
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

//get product by category id
export const getProductsByCategoryIdService = async (categoryId: number) => {
  try {
    const productsByCategory = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId));

    return productsByCategory as TSProduct[];
  } catch (err) {
    throw new Error(
      "Failed to fetch products by category: " + (err as Error).message
    );
  }
};
