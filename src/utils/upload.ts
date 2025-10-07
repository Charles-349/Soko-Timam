import cloudinary from "./cloudinary";
import type { Express } from "express";

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: "shops",        
    use_filename: true,
    unique_filename: true,
  });

  return result.secure_url; // URL to save in DB
};
