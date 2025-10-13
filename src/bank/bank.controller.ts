import { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import db from "../Drizzle/db";
import { sellers } from "../Drizzle/schema";
import { createBankAccountService, ICreateBankInput } from "./bank.service";
import { sql } from "drizzle-orm";

export const createBankAccount = async (req: Request, res: Response) => {
  try {
    // Verified JWT and extracted userId
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    } catch {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const userId = decoded.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
    }

    const { bankName, accountNumber, accountName, branchCode } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        message: "Missing required fields: bankName, accountNumber, or accountName",
      });
    }

    const seller = await db
      .select()
      .from(sellers)
      .where(sql`${sellers.userId} = ${userId}`)
      .limit(1);

    if (!seller || seller.length === 0) {
      return res.status(404).json({ message: "No seller profile found for this user" });
    }

    const sellerId = seller[0].id;

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
