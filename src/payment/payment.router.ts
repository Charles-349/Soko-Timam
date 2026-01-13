import { Express } from "express";
import {
  stkPushController,
  mpesaCallbackController,
  getPaymentStatusController,
  handleB2CResultController,
  handleB2CTimeoutController,
  paySellerB2CTestController,
} from "./payment.controller";

const payment = (app: Express) => {
  //Initiate STK Push (Customer initiates payment)
  app.route("/payment/stkpush").post(async (req, res, next) => {
    try {
      await stkPushController(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  //Safaricom Callback (Safaricom sends confirmation here)
  app.route("/payment/callback").post(async (req, res, next) => {
    try {
      await mpesaCallbackController(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  //Get Payment Status (Admin or Customer can check status)
  app.route("/payment/status/:orderId").get(async (req, res, next) => {
    try {
      await getPaymentStatusController(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.route("/payment/b2c/timeout").post(async (req, res, next) => {
    try {
      await handleB2CTimeoutController(req, res, next);
    } catch (error) {
      next(error);
    }
  });
  
   app.route("/payment/b2c/result").post(async (req, res, next) => {
    try {
      await handleB2CResultController(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.route("/payment/b2c/test").post(async (req, res, next) => {
    try {
      await paySellerB2CTestController(req, res, next);
    } catch (error) {
      next(error);
    }
  }); 
};

export default payment;
