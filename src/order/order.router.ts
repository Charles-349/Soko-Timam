import { Express } from "express";
import {
  createOrderController,
  getAllOrdersController,
  getOrderByIdController,
  cancelOrderController,
  markOrderPaidController,
  getOrdersByUserIdController,
  getOrdersBySellerIdController,
  markOrderAsShippedController,
  assignOriginStationController,
  getOrdersByAgentIdController,
  getStationsAndAgentsController,
  getOrdersByStationIdController,
  getOrdersByOriginStationIdController,
  markOrderReadyForPickupController,
  markOrderAsDeliveredController,
} from "./order.controller";
import { adminRoleAuth, customerRoleAuth } from "../middleware/bearAuth";
import { markOrderAsDeliveredService, markOrderAsReadyForPickupService } from "./order.service";

const order = (app: Express) => {
  //Create or Update Order 
  app.route("/order").post(async (req, res, next) => {
    try {
      await createOrderController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get All Orders 
  app.route("/order").get(async (req, res, next) => {
    try {
      await getAllOrdersController(req, res);
    } catch (error) {
      next(error);
    }
  });

    //get stations and agents 
  app.route("/order/stations-agents").get(async (req, res, next) => {
    try {
      await getStationsAndAgentsController(req, res);
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

  //Get Orders by Origin Station ID
  app.route("/order/origin-station/:stationId").get(async (req, res, next) => {
    try {
      await getOrdersByOriginStationIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get Orders by Station ID
  app.route("/order/station/:stationId").get(async (req, res, next) => {
    try {
      await getOrdersByStationIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Cancel Unpaid Order (Customer)
  app.route("/order/:id/cancel").put(async (req, res, next) => {
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

  //get user orders
  app.route("/order/user/:userId").get(async (req, res, next) => {
    try {
      await getOrdersByUserIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //get orders by seller id
    app.route("/order/seller/:sellerId").get(async (req, res, next) => {
    try {
      await getOrdersBySellerIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

    app.route("/station_manager/orders/:id/assign-station").post(async (req, res, next) => {
    try {
      await assignOriginStationController(req, res);
    } catch (error) {
      next(error);
    }
  });

   //Mark Order as Shipped 
  app.route("/order/:id/ship").post(async (req, res, next) => {
    try {
      await markOrderAsShippedController(req, res);
    } catch (error) {
      next(error);
    }
  });

    //Mark Order as Ready for Pickup
  app.route("/order/:id/ready-for-pickup").post(async (req, res, next) => {
    try {
      await markOrderReadyForPickupController(req, res);
    } catch (error) {
      next(error);
    }
  });

   //Mark Order as Delivered
  app.route("/order/:id/deliver").post(async (req, res, next) => {
    try {
      await markOrderAsDeliveredController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //get orders by agent id
    app.route("/agent/orders/:agentId").get(async (req, res, next) => {
    try {
      await getOrdersByAgentIdController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default order;
