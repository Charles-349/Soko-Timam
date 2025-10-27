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
  //Check if user exists
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new Error("No account found with that email");

  //Delete existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

  //Generate secure token and expiry
  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

  //Save token in passwordResetTokens table
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token: resetToken,
    expiresAt,
  });

  //Create frontend reset link
  const resetLink = `https://yourfrontend.com/reset-password?token=${resetToken}`;

  //Prepare email content
  const subject = "🔑 Reset your Soko Timam password";
  const message = `
    Hello ${user.firstname},

    You requested to reset your password. Click the link below to set a new one:
    ${resetLink}

    This link will expire in 15 minutes.
  `;

  const html = `
    <p>Hi ${user.firstname || "User"},</p>
    <p>You requested to reset your password for your Soko Timam account.</p>
    <p>Click the button below to reset it:</p>
    <p><a href="${resetLink}" style="background:#007bff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a></p>
    <p>This link expires in 15 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <br/>
    <p>Regards,<br/>Soko Timam Team</p>
  `;

  //Send email
  const emailResult = await sendEmail(email, subject, message, html);
  if (!emailResult.success) throw new Error(emailResult.message);

  return "Password reset email sent successfully";
};
//Reset Password
export const resetPasswordService = async (token: string, newPassword: string) => {
  //Validate inputs
  if (!token || !newPassword) {
    throw new Error("Token and new password are required");
  }

  //Find token record
  const [tokenRecord] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token));

  if (!tokenRecord) {
    throw new Error("Invalid or expired token");
  }

  //Check expiration
  if (new Date(tokenRecord.expiresAt) < new Date()) {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, tokenRecord.id));
    throw new Error("Reset token expired");
  }

  //Find the user
  const [user] = await db.select().from(users).where(eq(users.id, tokenRecord.userId));
  if (!user) {
    throw new Error("User not found");
  }

  //Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  //Update password in DB
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user.id));

  // Delete token after use
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.id, tokenRecord.id));

  return { success: true, message: "Password reset successful" };
};
