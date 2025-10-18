import { Request, Response } from "express";
import { sendTestEmailService } from "./mail.service";

export const sendTestEmailController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = await sendTestEmailService(email);

    return res.status(200).json({
      message: "Test email sent successfully",
      result,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
