
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../Drizzle/db";
import { passwordResetTokens, users } from "../Drizzle/schema";
import crypto from "crypto";
import {
  createUserService,
  deleteUserService,
  updateUserService,
  getUserByIdService,
  getUsersService,
  userLoginService,
  getUserByEmailService,
  getUserWithOrdersService,
  getUserWithCartService,
  getUserWithWishlistService,
  getUserWithReviewsService,
  resetPasswordService,
  forgotPasswordService,
} from "./user.service";
import { sendEmail } from "../mailer/mailer";
// Create user
// export const createUserController = async (req: Request, res: Response) => {
//   try {
//     const user = req.body;

//     // Validate password
//     if (!user.password || user.password.length < 6) {
//       return res
//         .status(400)
//         .json({ message: "Password must be at least 6 characters long" });
//     }

//     // Hash password
//     user.password = await bcrypt.hash(user.password, 10);

//     // Create user
//     await createUserService(user);

//     // Retrieve created user
//     const [createdUser] = await db
//       .select()
//       .from(users)
//       .where(eq(users.email, user.email))
//       .execute();

//     if (!createdUser) {
//       return res.status(500).json({ message: "User was not created properly." });
//     }

//     return res.status(201).json({
//       message: "User created successfully.",
//       user: {
//         id: createdUser.id,
//         firstname: createdUser.firstname,
//         lastname: createdUser.lastname,
//         email: createdUser.email,
//         role: createdUser.role,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error creating user:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };


// Create user 
export const createUserController = async (req: Request, res: Response) => {
  try {
    const user = req.body;

    // Check if the user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email))
      .execute();

    //If user exists
    if (existingUser) {
      //If it's a Google user, log them in
      if (user.isGoogleUser) {
        return res.status(200).json({
          message: "Logged in successfully via Google.",
          user: {
            id: existingUser.id,
            firstname: existingUser.firstname,
            lastname: existingUser.lastname,
            email: existingUser.email,
            role: existingUser.role,
          },
        });
      }

      //If not Google user, block registration
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    //Handle password
    if (!user.isGoogleUser) {
      if (!user.password || user.password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters long." });
      }

      user.password = await bcrypt.hash(user.password, 10);
    } else {
      // For Google users, mark password as special
      user.password = "google_oauth";
    }

    //Create user
    await createUserService(user);

    // Retrieve newly created user
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

    return res.status(201).json({
      message: "User created successfully.",
      user: {
        id: createdUser.id,
        firstname: createdUser.firstname,
        lastname: createdUser.lastname,
        email: createdUser.email,
        role: createdUser.role,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
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
       // Handle Google or passwordless accounts
    if (!userExist.password || userExist.password === "google_oauth") {
      return res.status(400).json({
        message:
          "This account was created with Google. Please log in using Google.",
      });
    }

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

//forgot password controller
// export const forgotPassword = async (req: Request, res: Response) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ message: "Email is required" });

//     const result = await forgotPasswordService(email);
//     return res.status(200).json({ message: result });
//   } catch (error: any) {
//     console.error("Forgot Password Error:", error);
//     return res.status(400).json({ message: error.message || "Error sending reset email" });
//   }
// };

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const result = await forgotPasswordService(email);

    return res.status(200).json({ message: result });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return res.status(400).json({
      message: error.message || "Error sending reset email",
    });
  }
};

// export const resetPassword = async (req: Request, res: Response) => {
//   try {
//     const { token, newPassword } = req.body;
//     if (!token || !newPassword)
//       return res.status(400).json({ message: "Token and new password are required" });

//     const result = await resetPasswordService(token, newPassword);
//     return res.status(200).json({ message: result });
//   } catch (error: any) {
//     console.error("Reset Password Error:", error);
//     return res.status(400).json({ message: error.message || "Error resetting password" });
//   }
// };

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPasswordService(token, newPassword);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return res.status(400).json({ message: error.message });
  }
};
