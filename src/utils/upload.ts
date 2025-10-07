import cloudinary from "./cloudinary";
import type { Express } from "express";

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "shops",
      use_filename: true,
      unique_filename: true,
    });

    if (!result.secure_url) {
      throw new Error("Cloudinary upload did not return a secure URL");
    }

    return result.secure_url; // URL to save in DB
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
};
