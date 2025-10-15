
import { Request, Response } from "express";
import * as SellerService from "./seller.service";

export const createSeller = async (req: Request, res: Response) => {
  try {
    const { userId, nationalId } = req.body;

    if (!userId || !nationalId) {
      return res.status(400).json({
        message: "userId and nationalId are required",
      });
    }

    const seller = await SellerService.registerSeller(Number(userId), nationalId);

    res.status(201).json({
      message: "Seller registered successfully",
      data: seller,
    });
  } catch (error: any) {
    console.error("Error registering seller:", error);
    res.status(400).json({ message: error.message || "Failed to register seller" });
  }
};

