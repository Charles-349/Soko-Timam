
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
  getShopWithOwnerService,
} from "../shop/shop.service";
import { ICreateShopInput } from "../shop/shop.service";
import db from "../Drizzle/db";
import { sellers, shops } from "../Drizzle/schema";
import { eq } from "drizzle-orm";

// CREATE SHOP
// export const createShop = async (req: Request, res: Response) => {
//   try {
//     // Verify JWT
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Unauthorized: Missing token" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded: any = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);
//     const userId = decoded.id;
//     // fetch sellerId from sellers table using userId
//     const [seller] = await db
//     .select()
//     .from(sellers)
//     .where(eq(sellers.userId, userId))
//     .limit(1);

//     const sellerId = seller?.id;
   

//     //  Extract data from form-data (all values come as strings)
//     const {
//       name,
//       description,
//       primaryCategory,
//       businessType,
//       businessRegistrationNumber,
//       kraPin,
//       taxId,
//       address,
//       city,
//       postalCode,
//       expectedMonthlyOrders,
//     } = req.body;

//     if (!name || !businessType || !primaryCategory) {
//       return res.status(400).json({
//         message: "Missing required fields: name, businessType, or primaryCategory",
//       });
//     }

    
//     const files = req.files as { logo?: Express.Multer.File[] };
//     const logoFile = files?.logo?.[0];

   
//     const shopData: ICreateShopInput = {
//       sellerId,
//       name,
//       description,
//       primaryCategory,
//       businessType,
//       businessRegistrationNumber,
//       kraPin,
//       taxId,
//       address,
//       city,
//       postalCode,
//       expectedMonthlyOrders: expectedMonthlyOrders ? Number(expectedMonthlyOrders) : undefined,
//       logoFile,
//     };

 
//     const newShop = await createShopService(shopData);

//     res.status(201).json({
//       message: "Shop created successfully",
//       shop: newShop,
//     });
//   } catch (error: any) {
//     console.error("Error creating shop:", error);
//     res.status(500).json({ message: error.message || "Failed to create shop" });
//   }
// };
//CREATE SHOP
export const createShop = async (req: Request, res: Response) => {
  try {
    // Get sellerId directly from body 
    const { sellerId, name, description, primaryCategory, businessType,
      businessRegistrationNumber, kraPin, taxId, address, city,
      postalCode, expectedMonthlyOrders } = req.body;

    if (!sellerId) {
      return res.status(400).json({ message: "Missing sellerId" });
    }

    if (!name || !businessType || !primaryCategory) {
      return res.status(400).json({
        message: "Missing required fields: name, businessType, or primaryCategory",
      });
    }

    const files = req.files as { logo?: Express.Multer.File[] };
    const logoFile = files?.logo?.[0];

    const shopData: ICreateShopInput = {
      sellerId: Number(sellerId),
      name,
      description,
      primaryCategory,
      businessType,
      businessRegistrationNumber,
      kraPin,
      taxId,
      address,
      city,
      postalCode,
      expectedMonthlyOrders: expectedMonthlyOrders ? Number(expectedMonthlyOrders) : undefined,
      logoFile,
    };

    const newShop = await createShopService(shopData);

    res.status(201).json({
      message: "Shop created successfully",
      shop: newShop,
    });
  } catch (error: any) {
    console.error("Error creating shop:", error);
    res.status(500).json({ message: error.message || "Failed to create shop" });
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

//get shop withn owner,products and order items
export const getShopWithOwner = async (req: Request, res: Response) => {
  try {
    const shopId = Number(req.params.id);
    if (isNaN(shopId)) {
      return res.status(400).json({ message: "Invalid shop ID" });
    }

    const shop = await getShopWithOwnerService(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.status(200).json(shop);
  } catch (error: any) {
    console.error("Error fetching shop with owner:", error);
    res.status(500).json({ message: error.message || "Failed to fetch shop" });
  }
};



