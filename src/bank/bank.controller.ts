// import { Request, Response } from "express";
// import Jwt from "jsonwebtoken";
// import db from "../Drizzle/db";
// import { sellers } from "../Drizzle/schema";
// import { createBankAccountService, deleteBankAccountService, getAllBankAccountsService, getBankAccountByIdService, getBankAccountsBySellerIdService, getBankAccountsBySellerUsernameService, ICreateBankInput, IUpdateBankAccountInput, updateBankAccountService } from "./bank.service";
// import { sql } from "drizzle-orm";

// const verifyToken = (req: Request, res: Response): any | null => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith("Bearer ")) {
//     res.status(401).json({ message: "Unauthorized: Missing token" });
//     return null;
//   }

//   const token = authHeader.split(" ")[1];
//   try {
//     const decoded = Jwt.verify(token, process.env.JWT_SECRET_KEY as string) as any;
//     return decoded;
//   } catch {
//     res.status(401).json({ message: "Unauthorized: Invalid token" });
//     return null;
//   }
// };

// export const createBankAccount = async (req: Request, res: Response) => {
//   try {
//     // Verified JWT and extracted userId
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Unauthorized: Missing token" });
//     }

//     const token = authHeader.split(" ")[1];
//     let decoded: any;
//     try {
//       decoded = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
//     } catch {
//       return res.status(401).json({ message: "Unauthorized: Invalid token" });
//     }

//     const userId = decoded.id;
//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
//     }

//     const { bankName, accountNumber, accountName, branchCode } = req.body;

//     if (!bankName || !accountNumber || !accountName) {
//       return res.status(400).json({
//         message: "Missing required fields: bankName, accountNumber, or accountName",
//       });
//     }

//     const seller = await db
//       .select()
//       .from(sellers)
//       .where(sql`${sellers.userId} = ${userId}`)
//       .limit(1);

//     if (!seller || seller.length === 0) {
//       return res.status(404).json({ message: "No seller profile found for this user" });
//     }

//     const sellerId = seller[0].id;

//     const bankData: ICreateBankInput = {
//       sellerId,
//       bankName,
//       accountNumber,
//       accountName,
//       branchCode,
//     };

//     const newBankAccount = await createBankAccountService(bankData);

//     return res.status(201).json({
//       message: "Bank account created successfully",
//       bank: newBankAccount,
//     });
//   } catch (error: any) {
//     console.error("Error creating bank account:", error);
//     return res.status(500).json({ message: error.message || "Failed to create bank account" });
//   }
// };
// export const getAllBankAccounts = async (req: Request, res: Response) => {
//   try {
//     const decoded = verifyToken(req, res);
//     if (!decoded) return;

//     // Ensure user has admin role
//     if (decoded.role !== "admin") {
//       return res.status(403).json({ message: "Forbidden: Admins only" });
//     }

//     const banks = await getAllBankAccountsService();
//     return res.status(200).json(banks);
//   } catch (error: any) {
//     console.error("Error fetching all bank accounts:", error);
//     return res.status(500).json({ message: "Failed to fetch bank accounts" });
//   }
// };

// //Get all bank accounts for the authenticated seller
// export const getSellerBankAccounts = async (req: Request, res: Response) => {
//   try {
//     const decoded = verifyToken(req, res);
//     if (!decoded) return;

//     const userId = decoded.id;

//     const seller = await db
//       .select()
//       .from(sellers)
//       .where(sql`${sellers.userId} = ${userId}`)
//       .limit(1);

//     if (seller.length === 0) {
//       return res.status(404).json({ message: "Seller not found" });
//     }

//     const sellerId = seller[0].id;
//     const banks = await getBankAccountsBySellerIdService(sellerId);

//     return res.status(200).json(banks);
//   } catch (error: any) {
//     console.error("Error fetching seller bank accounts:", error);
//     return res.status(500).json({ message: "Failed to fetch seller bank accounts" });
//   }
// };

// //Get a single bank account by ID
// export const getBankAccountById = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     const bank = await getBankAccountByIdService(id);

//     if (!bank) return res.status(404).json({ message: "Bank account not found" });
//     return res.status(200).json(bank);
//   } catch (error: any) {
//     console.error("Error fetching bank account:", error);
//     return res.status(500).json({ message: "Failed to fetch bank account" });
//   }
// };

// //Update a bank account by ID
// export const updateBankAccount = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     const data: IUpdateBankAccountInput = req.body;

//     const updated = await updateBankAccountService(id, data);
//     if (!updated) return res.status(404).json({ message: "Bank account not found" });

//     return res.status(200).json({ message: "Bank account updated", bank: updated });
//   } catch (error: any) {
//     console.error("Error updating bank account:", error);
//     return res.status(500).json({ message: "Failed to update bank account" });
//   }
// };

// //Delete a bank account by ID
// export const deleteBankAccount = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);

//     const deleted = await deleteBankAccountService(id);
//     if (!deleted) return res.status(404).json({ message: "Bank account not found" });

//     return res.status(200).json({ message: "Bank account deleted", bank: deleted });
//   } catch (error: any) {
//     console.error("Error deleting bank account:", error);
//     return res.status(500).json({ message: "Failed to delete bank account" });
//   }
// };

// export const getBankAccountsBySellerUsername = async (req: Request, res: Response) => {
//   try {
//     const { username } = req.params;

//     // Validating parameter
//     if (!username || username.trim() === "") {
//       return res.status(400).json({ message: "Username parameter is required" });
//     }

//     // Calling the service
//     const accounts = await getBankAccountsBySellerUsernameService(username);

//     // Handling not found case
//     if (!accounts || accounts.length === 0) {
//       return res.status(404).json({ message: "No bank accounts found for this seller" });
//     }

//     // Return the results
//     return res.status(200).json({
//       message: "Bank accounts fetched successfully",
//       count: accounts.length,
//       data: accounts,
//     });
//   } catch (error: any) {
//     console.error("Error fetching bank accounts by seller username:", error);
//     return res.status(500).json({
//       message: "Failed to fetch bank accounts by seller username",
//       error: error.message,
//     });
//   }
// };


import { Request, Response } from "express";
import db from "../Drizzle/db";
import { sellers } from "../Drizzle/schema";
import {
  createBankAccountService,
  deleteBankAccountService,
  getAllBankAccountsService,
  getBankAccountByIdService,
  getBankAccountsBySellerIdService,
  getBankAccountsBySellerUsernameService,
  getBankDetailsByShopIdService,
  ICreateBankInput,
  IUpdateBankAccountInput,
  updateBankAccountService,
} from "./bank.service";
import { sql } from "drizzle-orm";

//Create Bank Account
export const createBankAccount = async (req: Request, res: Response) => {
  try {
    const { sellerId, bankName, accountNumber, accountName, branchCode } = req.body;

    if (!sellerId || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        message: "Missing required fields: sellerId, bankName, accountNumber, or accountName",
      });
    }

    // Verify that seller exists
    const seller = await db
      .select()
      .from(sellers)
      .where(sql`${sellers.id} = ${sellerId}`)
      .limit(1);

    if (seller.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const bankData: ICreateBankInput = {
      sellerId,
      bankName,
      accountNumber,
      accountName,
      branchCode,
    };

    const newBankAccount = await createBankAccountService(bankData);

    return res.status(201).json({
      message: "Bank account created successfully",
      bank: newBankAccount,
    });
  } catch (error: any) {
    console.error("Error creating bank account:", error);
    return res.status(500).json({ message: error.message || "Failed to create bank account" });
  }
};

// Get All Bank Accounts
export const getAllBankAccounts = async (req: Request, res: Response) => {
  try {
    const banks = await getAllBankAccountsService();
    return res.status(200).json(banks);
  } catch (error: any) {
    console.error("Error fetching all bank accounts:", error);
    return res.status(500).json({ message: "Failed to fetch bank accounts" });
  }
};

// Get All Bank Accounts for a Seller 
export const getSellerBankAccounts = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "sellerId parameter is required" });
    }

    const banks = await getBankAccountsBySellerIdService(parseInt(sellerId));
    return res.status(200).json(banks);
  } catch (error: any) {
    console.error("Error fetching seller bank accounts:", error);
    return res.status(500).json({ message: "Failed to fetch seller bank accounts" });
  }
};

// Get Single Bank Account by ID
export const getBankAccountById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const bank = await getBankAccountByIdService(id);

    if (!bank) return res.status(404).json({ message: "Bank account not found" });
    return res.status(200).json(bank);
  } catch (error: any) {
    console.error("Error fetching bank account:", error);
    return res.status(500).json({ message: "Failed to fetch bank account" });
  }
};

// Update Bank Account by ID
export const updateBankAccount = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: IUpdateBankAccountInput = req.body;

    const updated = await updateBankAccountService(id, data);
    if (!updated) return res.status(404).json({ message: "Bank account not found" });

    return res.status(200).json({ message: "Bank account updated", bank: updated });
  } catch (error: any) {
    console.error("Error updating bank account:", error);
    return res.status(500).json({ message: "Failed to update bank account" });
  }
};

// Delete Bank Account by ID
export const deleteBankAccount = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const deleted = await deleteBankAccountService(id);
    if (!deleted) return res.status(404).json({ message: "Bank account not found" });

    return res.status(200).json({ message: "Bank account deleted", bank: deleted });
  } catch (error: any) {
    console.error("Error deleting bank account:", error);
    return res.status(500).json({ message: "Failed to delete bank account" });
  }
};

// Get Bank Accounts by Seller Username 
export const getBankAccountsBySellerUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Username parameter is required" });
    }

    const accounts = await getBankAccountsBySellerUsernameService(username);

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: "No bank accounts found for this seller" });
    }

    return res.status(200).json({
      message: "Bank accounts fetched successfully",
      count: accounts.length,
      data: accounts,
    });
  } catch (error: any) {
    console.error("Error fetching bank accounts by seller username:", error);
    return res.status(500).json({
      message: "Failed to fetch bank accounts by seller username",
      error: error.message,
    });
  }
};

//Controller: Get Bank Details by Shop ID
export const getBankDetailsByShopId = async (req: Request, res: Response) => {
  try {
    const shopId = Number(req.params.shopId);

    if (isNaN(shopId)) {
      return res.status(400).json({ message: "Invalid shop ID" });
    }

    const bankDetails = await getBankDetailsByShopIdService(shopId);
    return res.status(200).json({ message: "Bank details fetched successfully", data: bankDetails });
  } catch (error: any) {
    console.error("Error fetching bank details by shop ID:", error);
    return res.status(404).json({ message: error.message || "Failed to fetch bank details" });
  }
};
