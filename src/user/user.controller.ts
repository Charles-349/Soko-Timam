
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../Drizzle/db";
import { users } from "../Drizzle/schema";
import {
  createUserService,
  deleteUserService,
  updateUserService,
  getUserByIdService,
  getUsersService,
  userLoginService,
  getUserByEmailService,
  verifyUserService,
  updateVerificationCodeService,
  getUserWithOrdersService,
  getUserWithCartService,
  getUserWithWishlistService,
  getUserWithReviewsService,
} from "./user.service";
import { sendEmail } from "../mailer/mailer";

// Create User
export const createUserController = async (req: Request, res: Response) => {
  try {
    const user = req.body;
    const password = user.password;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expirationTime = new Date(Date.now() + 60 * 60 * 1000);
    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = expirationTime;
    user.isVerified = false;

    await createUserService(user);

    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email))
      .execute();

    if (!createdUser) {
      return res
        .status(500)
        .json({ message: "User was not created properly." });
    }

    try {
      await sendEmail(
        createdUser.email,
        "Verify your account",
        `Hello ${createdUser.firstname}, your verification code is: ${verificationCode}.`,
        `<div>
          <h2>Hello ${createdUser.firstname},</h2>
          <p>Your verification code is <strong>${verificationCode}</strong>.</p>
          <p>Please use this code to verify your account.</p>
        </div>`
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return res.status(201).json({
      message:
        "User created successfully. Please check your email for the verification code.",
      user: {
        id: createdUser.id,
        email: createdUser.email,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Verify User
export const verifyUserController = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  try {
    const user = await getUserByEmailService(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      !user.verificationCodeExpiresAt ||
      new Date() > new Date(user.verificationCodeExpiresAt)
    ) {
      return res
        .status(400)
        .json({ message: "Verification code has expired." });
    }

    if (user.verificationCode === code) {
      await verifyUserService(email);
      return res.status(200).json({ message: "User verified successfully" });
    }
    return res.status(400).json({ message: "Invalid verification code" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Resend Verification Code
export const resendVerificationCodeController = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;
  try {
    const user = await getUserByEmailService(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expirationTime = new Date(Date.now() + 60 * 60 * 1000);

    await updateVerificationCodeService(email, verificationCode, expirationTime);

    await sendEmail(
      email,
      "New Verification Code",
      `Hello ${user.firstname}, here is your new code: ${verificationCode}`,
      `<div>
        <h2>Hello ${user.firstname},</h2>
        <p>Your new code is <strong>${verificationCode}</strong>.</p>
      </div>`
    );

    return res
      .status(200)
      .json({ message: "New verification code sent successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Login
export const userLoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const userExist = await userLoginService(email);

    if (!userExist)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, userExist.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const payload = {
      sub: userExist.id,
      id: userExist.id,
      firstname: userExist.firstname,
      lastname: userExist.lastname,
      email: userExist.email,
      phone: userExist.phone,
      role: userExist.role,
    };

    const secret = process.env.JWT_SECRET_KEY as string;
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    return res
      .status(200)
      .json({ message: "Login successful", token, user: payload });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all users
export const getUsersController = async (req: Request, res: Response) => {
  try {
    const users = await getUsersService();
    return res
      .status(200)
      .json({ message: "Users retrieved successfully", users });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await getUserByIdService(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res
      .status(200)
      .json({ message: "User retrieved successfully", user });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update user
export const updateUserController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedUser = await updateUserService(id, req.body);
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete user
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deletedUser = await deleteUserService(id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



// User with Orders
export const getUserWithOrdersController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userOrders = await getUserWithOrdersService(id);
    return res.status(200).json({
      message: "User with orders retrieved successfully",
      data: userOrders,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// User with Cart
export const getUserWithCartController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userCart = await getUserWithCartService(id);
    return res.status(200).json({
      message: "User with cart retrieved successfully",
      data: userCart,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// User with Wishlist
export const getUserWithWishlistController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userWishlist = await getUserWithWishlistService(id);
    return res.status(200).json({
      message: "User with wishlist retrieved successfully",
      data: userWishlist,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// User with Reviews
export const getUserWithReviewsController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userReviews = await getUserWithReviewsService(id);
    return res.status(200).json({
      message: "User with reviews retrieved successfully",
      data: userReviews,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get user by Email
export const getUserByEmailController = async (req: Request, res: Response) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await getUserByEmailService(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error: any) {
    console.error("Error fetching user by email:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve user by email",
    });
  }
};

