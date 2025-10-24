import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { passwordResetTokens, TIUser, users } from "../Drizzle/schema";
import { sendEmail } from "../mailer/mailer";
import crypto from "crypto";
import bcrypt from "bcrypt";                  


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

//Forgot Password
export const forgotPasswordService = async (email: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) throw new Error("User not found");

  // Delete any existing tokens for that user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

  // Create new token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  const resetLink = `https://your-frontend-domain.com/reset-password?token=${token}`;

  await sendEmail(
    email,
    "Reset your password",
    `Use the link below to reset your password:\n\n${resetLink}`,
    `
      <p>Hi ${user.firstname || "there"},</p>
      <p>You requested to reset your password. Click the link below to set a new one:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>This link will expire in <b>15 minutes</b>.</p>
    `
  );

  return "Password reset email sent successfully";
};

//Reset Password
export const resetPasswordService = async (token: string, newPassword: string) => {
  const tokenRecord = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });

  if (!tokenRecord) throw new Error("Invalid or expired token");
  if (tokenRecord.expiresAt < new Date()) throw new Error("Reset token expired");

  const user = await db.query.users.findFirst({
    where: eq(users.id, tokenRecord.userId),
  });

  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));

  // Delete used token
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));

  return "Password reset successful";
};