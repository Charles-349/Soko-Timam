import { Request, Response } from "express";
import * as SellerService from "./seller.service";

export const createSeller = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // from middleware
    const { nationalId } = req.body;

    if (!nationalId) {
      return res.status(400).json({ message: "National ID is required" });
    }

    const seller = await SellerService.registerSeller(userId, nationalId);

    res.status(201).json({
      message: "Seller registered successfully",
      data: seller,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
