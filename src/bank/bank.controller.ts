import { Request, Response } from "express";
import { createBankAccountService } from "./bank.service";

export const createBankAccount = async (req: Request, res: Response) => {
  try {
    const { bankName, accountNumber, accountName, branchCode } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Assuming you get sellerId from JWT
    const sellerId = (req as any).sellerId;

    const newBank = await createBankAccountService({
      sellerId,
      bankName,
      accountNumber,
      accountName,
      branchCode,
    });

    res.status(201).json({
      message: "Bank account added successfully",
      bank: newBank,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
