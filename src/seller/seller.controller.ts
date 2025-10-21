
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

//get seller details by user id
export const getSellerByUserId = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId parameter" });
    }

    const seller = await SellerService.getSellerByUserId(userId);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({
      message: "Seller retrieved successfully",
      data: seller,
    });
  } catch (error: any) {
    console.error("Error fetching seller by userId:", error);
    res.status(500).json({ message: error.message || "Failed to retrieve seller" });
  }
}

