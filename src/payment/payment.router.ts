import { Express } from "express";
import {
  getPaymentStatusController,
  stkPushAndCallbackController,
} from "./payment.controller";

const payment = (app: Express) => {
  //Initiate STK Push (Customer initiates payment)
  app.route("/payment/stkpush").post(async (req, res, next) => {
    try {
      await stkPushAndCallbackController(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  //Safaricom Callback (Safaricom sends confirmation here)
  // app.route("/payment/callback").post(async (req, res, next) => {
  //   try {
  //     await mpesaCallbackController(req, res, next);
  //   } catch (error) {
  //     next(error);
  //   }
  // });

  //Get Payment Status (Admin or Customer can check status)
  app.route("/payment/status/:orderId").get(async (req, res, next) => {
    try {
      await getPaymentStatusController(req, res, next);
    } catch (error) {
      next(error);
    }
  });
};

export default payment;
