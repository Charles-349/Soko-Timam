import { Express } from "express";
import { sendTestEmailController } from "./mail.controller";

const mail = (app: Express) => {
  app.route("/mail/test").post(async (req, res, next) => {
    try {
      await sendTestEmailController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default mail;
