import { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import { createBankAccountService, ICreateBankInput } from "./bank.service";

export const createBankAccount = async (req: Request, res: Response) => {
  try {
    // Verify JWT
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Missing token" });
    }
    const token = authHeader.split(" ")[1];
    const decoded: any = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    const sellerId = decoded.id;

    const { bankName, accountNumber, accountName, branchCode } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bankData: ICreateBankInput = {
      sellerId,
      bankName,
      accountNumber,
      accountName,
      branchCode,
    };

    const newBank = await createBankAccountService(bankData);

    res.status(201).json({ message: "Bank account created", bank: newBank });
  } catch (error: any) {
    console.error("Error creating bank account:", error);
    res.status(500).json({ message: error.message || "Failed to create bank account" });
  }
};
