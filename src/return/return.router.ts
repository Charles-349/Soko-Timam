import { Express } from "express";
import {
  createReturnController,
  processReturnRefundController,
  getReturnsController,
  getReturnByIdController,
  reviewReturnController,
  processReturnExchangeController,
  handleReplacementShipmentDeliveredController,
  triggerReturnResolutionController,
} from "./return.controller";
import { adminRoleAuth } from "../middleware/bearAuth";

const returnsRouter = (app: Express) => {
  // Create Return Request
  app.route("/returns").post(async (req, res, next) => {
    try {
      await createReturnController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // REVIEW RETURN REQUEST - Approve or Reject
  app
    .route("/returns/:returnId/review")
    .post(adminRoleAuth, async (req, res, next) => {
      try {
        await reviewReturnController(req, res);
      } catch (error) {
        next(error);
      }
    });

  // Process Return Refund
  app
    .route("/returns/refund")
    .post(adminRoleAuth, async (req, res, next) => {
      try {
        await processReturnRefundController(req, res);
      } catch (error) {
        next(error);
      }
    });

  //Process exchange for return
  app
    .route("/returns/exchange")
    .post(adminRoleAuth, async (req, res, next) => {
      try {
        await processReturnExchangeController(req, res);
      } catch (error) {
        next(error);
      }
    });
  
  //Shipment delivered for replacement shipments  
    app.route("/returns/replacement-delivered")
    .post(async (req, res, next) => {
      try {
        await handleReplacementShipmentDeliveredController(req, res);
      } catch (error) {
        next(error);
      }
    });

  // Get All Returns 
  app.route("/returns").get(async (req, res, next) => {
    try {
      await getReturnsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Single Return by ID
  app.route("/returns/:returnId").get(async (req, res, next) => {
    try {
      await getReturnByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.route("/returns/:returnId/process-resolution").post(async (req, res, next)=>{
    try{
    await triggerReturnResolutionController(req, res);
    } catch (error) {
      next(error);
    }
  })
};

export default returnsRouter;