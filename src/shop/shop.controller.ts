
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
import { notifications, sellers, shops } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../mailer/mailer";
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

    // Update shop
    const [updatedShop] = await db
      .update(shops)
      .set(req.body)
      .where(eq(shops.id, id))
      .returning();

    if (!updatedShop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Send notification and email if status changed
    if (req.body.status === "active" || req.body.status === "suspended") {
      // Find the seller
      const [seller] = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, updatedShop.sellerId));

      if (seller) {
        const isActivated = req.body.status === "active";
        const subject = isActivated
          ? `Your shop "${updatedShop.name}" is now active 🎉`
          : `Your shop "${updatedShop.name}" has been suspended ⚠️`;

        const message = isActivated
          ? `🎉 Great news! Your shop "${updatedShop.name}" has been approved and activated on Soko Timam. Customers can now view and buy your products.`
          : `⚠️ Your shop "${updatedShop.name}" has been suspended. Please contact support if you believe this was a mistake.`;

        // Create DB notification
        await db.insert(notifications).values({
          userId: seller.userId,
          message,
          type: "shop_status",
          isRead: false,
        });

        // Send Email
        await sendEmail(
          "wamahiucharles123@gmail.com",
          subject,
          message,
          `<p>${message}</p><br/><p>Regards,<br/>Soko Timam Team</p>`
        );
      }
    }

    return res.status(200).json({
      message: "Shop updated successfully",
      shop: updatedShop,
    });
  } catch (error: any) {
    console.error("Error updating shop:", error);
    return res.status(500).json({ message: error.message });
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



