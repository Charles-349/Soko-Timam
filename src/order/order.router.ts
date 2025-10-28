import { Express } from "express";
import {
  createOrderController,
  getAllOrdersController,
  getOrderByIdController,
  cancelOrderController,
  markOrderPaidController,
} from "./order.controller";
import { adminRoleAuth, customerRoleAuth } from "../middleware/bearAuth";

const order = (app: Express) => {
  //Create or Update Order (Customer)
  app.route("/order").post(customerRoleAuth, async (req, res, next) => {
    try {
      await createOrderController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get All Orders 
  app.route("/order").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getAllOrdersController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get Order by ID 
  app.route("/order/:id").get(async (req, res, next) => {
    try {
      await getOrderByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Cancel Unpaid Order (Customer)
  app.route("/order/:id/cancel").put(customerRoleAuth, async (req, res, next) => {
    try {
      await cancelOrderController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Mark Order as Paid (Admin or Payment Callback)
  app.route("/order/mark-paid").put(async (req, res, next) => {
    try {
      await markOrderPaidController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default order;
