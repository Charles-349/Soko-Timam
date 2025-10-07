import { Request, Response } from "express";
import {
  createShopService,
  getAllShopsService,
  getShopByIdService,
  getShopsByOwnerService,
  updateShopService,
  deleteShopService,
  getShopWithProductsService,
  getShopWithOrdersService,
} from "../shop/shop.service";
import type { Multer } from "multer";
import Jwt from 'jsonwebtoken';
import { shops } from "../Drizzle/schema";
import db from "../Drizzle/db";



// CREATE 
// export const createShopController = async (req: Request, res: Response) => {
//   try {
//     const shop = await createShopService(req.body);
//     return res.status(201).json({
//       message: "Shop created successfully",
//       shop,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message });
//   }
// };


// interface AuthenticatedRequest extends Request {
//   user: {
//     id: number;
//     email?: string;
//     role?: string;
//   };
// }
// interface MulterFiles {
//   logo?: Express.Multer.File[];
//   cover?: Express.Multer.File[];
// }

// export const createShopController = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { name, description, location } = req.body;

//     // Typecast files
//     const files = req.files as MulterFiles;

//     const logoFile = files?.logo?.[0];
//     const coverFile = files?.cover?.[0];

//     const shop = await createShopService({
//       name,
//       description,
//       location,
//       ownerId: req.user.id, 
//       logoFile,
//       coverFile,
//     });

//     return res.status(201).json({
//       message: "Shop created successfully",
//       shop,
//     });
//   } catch (error: any) {
//     console.error(error);
//     return res.status(500).json({ message: error.message || "Internal Server Error" });
//   }
// };


// export const createShopController = async (req: Request, res: Response) => {
//   try {
//     const { name, description, location } = req.body;

//     const files = req.files as {
//       logo?: Express.Multer.File[];
//       cover?: Express.Multer.File[];
//     };

//     const shop = await createShopService({
//       name,
//       description,
//       location,
//       ownerId: req.user!.id, // fully typed!
//       logoFile: files.logo?.[0],
//       coverFile: files.cover?.[0],
//     });

//     return res.status(201).json({
//       message: "Shop created successfully",
//       shop,
//     });
//   } catch (error: any) {
//     console.error(error);
//     return res.status(500).json({ message: error.message || "Internal Server Error" });
//   }
// };



export const createShop = async (req: Request, res: Response) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Decode token
    const token = authHeader.split(" ")[1];
    const decoded: any = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);

    const ownerId = decoded.id;

    // Extract shop data
    const { name, description, status } = req.body;

    // Insert into DB and return the new shop
    const newShop = await db
      .insert(shops)
      .values({
        ownerId,
        name,
        description,
        status,
      })
      .returning();

    // Respond with clean JSON
    res.status(201).json({
      message: "Shop created successfully",
      shop: newShop[0],
    });
  } catch (error) {
    console.error("Error creating shop:", error);
    res.status(500).json({ message: "Failed to create shop" });
  }
};




//READ ALL 
export const getAllShopsController = async (req: Request, res: Response) => {
  try {
    const shops = await getAllShopsService();
    return res.status(200).json({
      message: "Shops retrieved successfully",
      shops,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

//READ ONE 
export const getShopByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopByIdService(id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    return res
      .status(200)
      .json({ message: "Shop retrieved successfully", shop });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// READ BY OWNER
export const getShopsByOwnerController = async (req: Request, res: Response) => {
  try {
    const ownerId = parseInt(req.params.ownerId);
    if (!ownerId)
      return res.status(400).json({ message: "Invalid owner ID" });

    const shops = await getShopsByOwnerService(ownerId);
    return res.status(200).json({
      message: "Shops retrieved successfully for owner",
      shops,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateShopController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const updatedShop = await updateShopService(id, req.body);
    if (!updatedShop)
      return res.status(404).json({ message: "Shop not found" });

    return res
      .status(200)
      .json({ message: "Shop updated successfully", shop: updatedShop });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteShopController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const deletedShop = await deleteShopService(id);
    if (!deletedShop)
      return res.status(404).json({ message: "Shop not found" });

    return res
      .status(200)
      .json({ message: "Shop deleted successfully", shop: deletedShop });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};



// Shop with Products
export const getShopWithProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopWithProductsService(id);
    if (!shop)
      return res.status(404).json({ message: "Shop or products not found" });

    return res.status(200).json({
      message: "Shop with products retrieved successfully",
      shop,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Shop with Orders
export const getShopWithOrdersController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop ID" });

    const shop = await getShopWithOrdersService(id);
    if (!shop)
      return res.status(404).json({ message: "Shop or orders not found" });

    return res.status(200).json({
      message: "Shop with orders retrieved successfully",
      shop,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
