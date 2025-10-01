import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { TIUser, users } from "../Drizzle/schema";

// Create user
export const createUserService = async (user: TIUser) => {
  await db.insert(users).values(user);
  return "User created successfully";
};

// Get user by email
export const getUserByEmailService = async (email: string) => {
  return await db.query.users.findFirst({
    where: sql`${users.email} = ${email}`,
  });
};

// Verify user account
export const verifyUserService = async (email: string) => {
  await db
    .update(users)
    .set({ isVerified: true, verificationCode: null })
    .where(sql`${users.email} = ${email}`);
};

// Update verification code
export const updateVerificationCodeService = async (
  email: string,
  verificationCode: string,
  expirationTime: Date
) => {
  await db
    .update(users)
    .set({
      verificationCode,
      verificationCodeExpiresAt: expirationTime,
    })
    .where(sql`${users.email} = ${email}`);
};

// Login user
export const userLoginService = async (email: string) => {
  return await db.query.users.findFirst({
    columns: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      password: true,
      phone: true,
      role: true,
      isVerified: true,
    },
    where: sql`${users.email} = ${email}`,
  });
};

// Get all users
export const getUsersService = async () => {
  return await db.query.users.findMany();
};

// Get user by ID
export const getUserByIdService = async (id: number) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
  });
};

// Update user
export const updateUserService = async (id: number, user: Partial<TIUser>) => {
  const updatedUser = await db
    .update(users)
    .set(user)
    .where(eq(users.id, id))
    .returning();

  if (updatedUser.length === 0) {
    return null;
  }
  return "User updated successfully";
};

// Delete user
export const deleteUserService = async (id: number) => {
  const deletedUser = await db.delete(users).where(eq(users.id, id)).returning();

  if (deletedUser.length === 0) {
    return null;
  }
  return "User deleted successfully";
};

// RELATIONS

// User with Orders
export const getUserWithOrdersService = async (id: number) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      orders: { with: { items: true, payments: true, shipping: true } },
    },
  });
};

// User with Cart
export const getUserWithCartService = async (id: number) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      carts: { with: { items: true } },
    },
  });
};

// User with Wishlist
export const getUserWithWishlistService = async (id: number) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      wishlists: { with: { product: true } },
    },
  });
};

// User with Reviews
export const getUserWithReviewsService = async (id: number) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      reviews: { with: { product: true } },
    },
  });
};

// User with everything (shops, carts, orders, wishlist, reviews, notifications)
export const getUserWithRelationsService = async (id: number) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      shops: true,
      carts: { with: { items: true } },
      orders: { with: { items: true, payments: true, shipping: true } },
      wishlists: { with: { product: true } },
      reviews: { with: { product: true } },
      notifications: true,
    },
  });
};
