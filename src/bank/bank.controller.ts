import { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import { createBankAccountService, ICreateBankInput } from "./bank.service";

export const createBankAccount = async (req: Request, res: Response) => {
  try {
    //  Verify JWT and extract sellerId
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    const sellerId = decoded.id;

    // Extract bank details from request body
    const { bankName, accountNumber, accountName, branchCode } = req.body;

    //  Validate required fields
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        message: "Missing required fields: bankName, accountNumber, or accountName",
      });
    }

    const bankData: ICreateBankInput = {
      sellerId,
      bankName,
      accountNumber,
      accountName,
      branchCode,
    };

    const newBankAccount = await createBankAccountService(bankData);


    res.status(201).json({
      message: "Bank account created successfully",
      bank: newBankAccount,
    });
  } catch (error: any) {
    console.error("Error creating bank account:", error);
    res.status(500).json({ message: error.message || "Failed to create bank account" });
  }
};
