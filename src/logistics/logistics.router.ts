import { Express } from "express";
import {
  createStationController,
  getStationsController,
  getStationByIdController,
  updateStationController,
  deleteStationController,
  createAgentController,
  getAgentsController,
  getAgentByIdController,
  updateAgentController,
  deleteAgentController,
  createShippingController,
  getShippingController,
  getShippingByIdController,
  updateShippingController,
  deleteShippingController,
  getShippingWithOrderController,
  getShippingsByDateRangeController,
  getCompletedShippingsController,
  getActiveShippingsController,
  getShippingsByStatusController,
  getShippingByOrderIdController,
} from "./logistics.contoller";

const logistics = (app: Express) => {



  // Create Station
  app.route("/station").post(async (req, res, next) => {
    try {
      await createStationController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Stations
  app.route("/station").get(async (req, res, next) => {
    try {
      await getStationsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Station By ID
  app.route("/station/:id").get(async (req, res, next) => {
    try {
      await getStationByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Station
  app.route("/station/:id").put(async (req, res, next) => {
    try {
      await updateStationController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Station
  app.route("/station/:id").delete(async (req, res, next) => {
    try {
      await deleteStationController(req, res);
    } catch (error) {
      next(error);
    }
  });



  // Create Agent
  app.route("/agent").post(async (req, res, next) => {
    try {
      await createAgentController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Agents
  app.route("/agent").get(async (req, res, next) => {
    try {
      await getAgentsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Agent By ID
  app.route("/agent/:id").get(async (req, res, next) => {
    try {
      await getAgentByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Agent
  app.route("/agent/:id").put(async (req, res, next) => {
    try {
      await updateAgentController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Agent
  app.route("/agent/:id").delete(async (req, res, next) => {
    try {
      await deleteAgentController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Create Shipping
  app.route("/shipping").post(async (req, res, next) => {
    try {
      await createShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Shipping
  app.route("/shipping").get(async (req, res, next) => {
    try {
      await getShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Shipping By ID
  app.route("/shipping/:id").get(async (req, res, next) => {
    try {
      await getShippingByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Shipping
  app.route("/shipping/:id").put(async (req, res, next) => {
    try {
      await updateShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Shipping
  app.route("/shipping/:id").delete(async (req, res, next) => {
    try {
      await deleteShippingController(req, res);
    } catch (error) {
      next(error);
    }
  });


    // Shipping by Order ID
    app.route("/shipping/order/:orderId").get(async (req, res, next) => {
      try {
        await getShippingByOrderIdController(req, res);
      } catch (error) {
        next(error);
      }
    });
  
    // Shippings by Status
    app.route("/shipping/status/:status").get(async (req, res, next) => {
      try {
        await getShippingsByStatusController(req, res);
      } catch (error) {
        next(error);
      }
    });
  
    // Active Shippings
    app.route("/shipping/active").get(async (req, res, next) => {
      try {
        await getActiveShippingsController(req, res);
      } catch (error) {
        next(error);
      }
    });
  
    // Completed Shippings
    app.route("/shipping/completed").get(async (req, res, next) => {
      try {
        await getCompletedShippingsController(req, res);
      } catch (error) {
        next(error);
      }
    });
  
    // Shippings by Date Range
    app.route("/shipping/date-range").get(async (req, res, next) => {
      try {
        await getShippingsByDateRangeController (req, res);
      } catch (error) {
        next(error);
      }
    });
  
    // Shipping with related Order
    app.route("/shipping/:id/order").get(async (req, res, next) => {
      try {
        await getShippingWithOrderController(req, res);
      } catch (error) {
        next(error);
      }
    });

};

export default logistics;
