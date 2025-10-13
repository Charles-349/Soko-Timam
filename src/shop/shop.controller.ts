// import { Request, Response } from "express";
// import {
//   createShopService,
//   getAllShopsService,
//   getShopByIdService,
//   getShopsByOwnerService,
//   updateShopService,
//   deleteShopService,
//   getShopWithProductsService,
//   getShopWithOrdersService,
// } from "../shop/shop.service";
// import type { Multer } from "multer";
// import Jwt from 'jsonwebtoken';
// import { shops } from "../Drizzle/schema";
// import db from "../Drizzle/db";
// import { ICreateShopInput} from "../shop/shop.service";


// export const createShop = async (req: Request, res: Response) => {
//   try {
//     // Extract and verify JWT token
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Unauthorized: No token provided" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded: any = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
//     const ownerId = decoded.id;

//     // Extract shop data from body
//     const { name, description, status, location } = req.body;

//     if (!name || !status) {
//       return res.status(400).json({ message: "Missing required fields: name and status" });
//     }

//     // Extract files from multer
//     const files = req.files as {
//       logo?: Express.Multer.File[];
//       cover?: Express.Multer.File[];
//     };

//     //  Build shop input object
//     const shopData: ICreateShopInput = {
//       ownerId,
//       name,
//       description,
//       location,
//       logoFile: files?.logo?.[0],
//       coverFile: files?.cover?.[0],
//     };

//     // Insert shop into DB using service
//     const newShop = await createShopService(shopData);

//     // Respond with success
//     res.status(201).json({
//       message: "Shop created successfully",
//       shop: newShop,
//     });
//   } catch (error: any) {
//     console.error("Error creating shop:", error);
//     res.status(500).json({
//       message: error.message || "Failed to create shop",
//     });
//   }
// };
// //READ ALL 
// export const getAllShopsController = async (req: Request, res: Response) => {
//   try {
//     const shops = await getAllShopsService();
//     return res.status(200).json({
//       message: "Shops retrieved successfully",
//       shops,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// //READ ONE 
// export const getShopByIdController = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (!id) return res.status(400).json({ message: "Invalid shop ID" });

//     const shop = await getShopByIdService(id);
//     if (!shop) return res.status(404).json({ message: "Shop not found" });

//     return res
//       .status(200)
//       .json({ message: "Shop retrieved successfully", shop });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// // READ BY OWNER
// export const getShopsByOwnerController = async (req: Request, res: Response) => {
//   try {
//     const ownerId = parseInt(req.params.ownerId);
//     if (!ownerId)
//       return res.status(400).json({ message: "Invalid owner ID" });

//     const shops = await getShopsByOwnerService(ownerId);
//     return res.status(200).json({
//       message: "Shops retrieved successfully for owner",
//       shops,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// // UPDATE
// export const updateShopController = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (!id) return res.status(400).json({ message: "Invalid shop ID" });

//     const updatedShop = await updateShopService(id, req.body);
//     if (!updatedShop)
//       return res.status(404).json({ message: "Shop not found" });

//     return res
//       .status(200)
//       .json({ message: "Shop updated successfully", shop: updatedShop });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// // DELETE
// export const deleteShopController = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (!id) return res.status(400).json({ message: "Invalid shop ID" });

//     const deletedShop = await deleteShopService(id);
//     if (!deletedShop)
//       return res.status(404).json({ message: "Shop not found" });

//     return res
//       .status(200)
//       .json({ message: "Shop deleted successfully", shop: deletedShop });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };



// // Shop with Products
// export const getShopWithProductsController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (!id) return res.status(400).json({ message: "Invalid shop ID" });

//     const shop = await getShopWithProductsService(id);
//     if (!shop)
//       return res.status(404).json({ message: "Shop or products not found" });

//     return res.status(200).json({
//       message: "Shop with products retrieved successfully",
//       shop,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// // Shop with Orders
// export const getShopWithOrdersController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (!id) return res.status(400).json({ message: "Invalid shop ID" });

//     const shop = await getShopWithOrdersService(id);
//     if (!shop)
//       return res.status(404).json({ message: "Shop or orders not found" });

//     return res.status(200).json({
//       message: "Shop with orders retrieved successfully",
//       shop,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };

import { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import {
  createShopService,
  getAllShopsService,
  getShopByIdService,
  getShopsBySellerService,
  updateShopService,
  deleteShopService,
  getShopWithProductsService,
  getShopWithOrdersService,
} from "../shop/shop.service";
import { ICreateShopInput } from "../shop/shop.service";

// CREATE SHOP
export const createShop = async (req: Request, res: Response) => {
  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    const sellerId = decoded.id;

    // Extract form fields
    const {
      name,
      description,
      primaryCategory,
      businessType,
      productCategories,
      businessRegistrationNumber,
      kraPin,
      taxId,
      address,
      city,
      postalCode,
      expectedMonthlyOrders,
    } = req.body;

    if (!name || !businessType || !primaryCategory) {
      return res.status(400).json({
        message: "Missing required fields: name, businessType, or primaryCategory",
      });
    }

    // Get uploaded files (from Multer)
    const files = req.files as {
      logo?: Express.Multer.File[];
    };

    const shopData: ICreateShopInput = {
      sellerId,
      name,
      description,
      primaryCategory,
      businessType,
      productCategories, 
      businessRegistrationNumber,
      kraPin,
      taxId,
      address,
      city,
      postalCode,
      expectedMonthlyOrders: expectedMonthlyOrders
        ? Number(expectedMonthlyOrders)
        : undefined,
      logoFile: files?.logo?.[0],
    };

    const newShop = await createShopService(shopData);

    res.status(201).json({
      message: "Shop created successfully",
      shop: newShop,
    });
  } catch (error: any) {
    console.error("Error creating shop:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to create shop" });
  }
};


// READ ALL
export const getAllShopsController = async (req: Request, res: Response) => {
  try {
    const shops = await getAllShopsService();
    res.status(200).json({ message: "Shops retrieved successfully", shops });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// READ ONE
export const getShopByIdController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopByIdService(id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.status(200).json({ message: "Shop retrieved successfully", shop });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// READ BY SELLER
export const getShopsBySellerController = async (req: Request, res: Response) => {
  try {
    const sellerId = Number(req.params.sellerId);
    if (!sellerId) return res.status(400).json({ message: "Invalid seller ID" });

    const shops = await getShopsBySellerService(sellerId);
    res.status(200).json({
      message: "Shops retrieved successfully for seller",
      shops,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateShopController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const updatedShop = await updateShopService(id, req.body);
    if (!updatedShop.length)
      return res.status(404).json({ message: "Shop not found" });

    res.status(200).json({
      message: "Shop updated successfully",
      shop: updatedShop[0],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteShopController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const deletedShop = await deleteShopService(id);
    if (!deletedShop.length)
      return res.status(404).json({ message: "Shop not found" });

    res.status(200).json({
      message: "Shop deleted successfully",
      shop: deletedShop[0],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// SHOP WITH PRODUCTS
export const getShopWithProductsController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopWithProductsService(id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.status(200).json({ message: "Shop with products retrieved", shop });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// SHOP WITH ORDERS
export const getShopWithOrdersController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopWithOrdersService(id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.status(200).json({ message: "Shop with orders retrieved", shop });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
