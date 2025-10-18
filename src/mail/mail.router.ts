import { Express } from "express";
import { sendEmail } from "../mailer/mailer";

const mail = (app: Express) => {
  app.route("/mail/test").post(async (req, res, next) => {
    try {
      const { email } = req.body;
      const response = await sendEmail(
        email,
        "Soko Timam Test Email",
        "Hello! This is a test email from your Render app."
      );
      res.status(200).json({ message: "Email sent", response });
    } catch (error) {
      next(error);
    }
  });
};

export default mail;
