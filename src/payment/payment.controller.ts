// import { Request, Response, RequestHandler } from "express";
// import {
//   initiateStkPush,
//   handleMpesaCallback,
//   getPaymentStatus,
// } from "./payment.service";

// //STK Push Controller
// export const stkPushController: RequestHandler = async (req: Request, res: Response): Promise<void> => {
//   console.log("stkPushController called!");
//   try {
//     const { phoneNumber, amount, orderId } = req.body;

//     if (!phoneNumber || !amount || !orderId) {
//       console.log("Missing field. Returning 400");
//       res.status(400).json({ success: false, message: "Missing required fields (phoneNumber, amount, orderId)" });
//       return;
//     }

//     const data = await initiateStkPush({
//       phoneNumber,
//       amount: Number(amount),
//       orderId: Number(orderId),
//     });

//     res.status(200).json({
//       success: true,
//       message: "STK Push initiated successfully",
//       data,
//     });
//   } catch (error) {
//     console.error("STK Push Error:", (error as Error).message);
//     res.status(500).json({ success: false, message: "STK push failed" });
//   }
// };

// //Safaricom Callback Controller
// export const mpesaCallbackController: RequestHandler = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const orderIdParam = req.query.orderId;
//     const orderId = Number(orderIdParam);

//     if (isNaN(orderId)) {
//       res.status(400).json({ message: "Invalid or missing orderId in callback URL" });
//       return;
//     }

//     await handleMpesaCallback(orderId, req.body);
//     res.status(200).json({ message: "Callback processed successfully" });
//   } catch (error) {
//     console.error("Callback Error:", (error as Error).message);
//     res.status(500).json({ message: "Failed to handle callback" });
//   }
// };

// //Get Payment Status Controller
// export const getPaymentStatusController: RequestHandler = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { orderId } = req.params;

//     if (!orderId || isNaN(Number(orderId))) {
//       res.status(400).json({ success: false, message: "Invalid or missing orderId" });
//       return;
//     }

//     const payment = await getPaymentStatus(Number(orderId));

//     res.status(200).json({
//       success: true,
//       data: payment,
//     });
//   } catch (error) {
//     console.error("Get Payment Status Error:", (error as Error).message);
//     res.status(500).json({ success: false, message: "Failed to get payment status" });
//   }
// };



import { Request, Response, RequestHandler } from "express";
import { initiateStkPush, getPaymentStatus } from "./payment.service";

export const mpesaController = {
  //Initiate STK Push
  stkPush: async (req: Request, res: Response) => {
    try {
      const { phoneNumber, amount, orderId } = req.body;

      if (!phoneNumber || !amount || !orderId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields (phoneNumber, amount, orderId)" });
      }

      const data = await initiateStkPush.initiate({
        phoneNumber,
        amount: Number(amount),
        orderId: Number(orderId),
      });

      return res.status(200).json({
        success: true,
        message: "STK Push initiated successfully",
        data,
      });
    } catch (error) {
      console.error("STK Push Error:", (error as Error).message);
      return res.status(500).json({ success: false, message: "STK push failed" });                        
    }
  },

  // 🔹 Handle Safaricom Callback
  callback: async (req: Request, res: Response) => {
    try {
      const orderIdParam = req.query.orderId;
      const orderId = Number(orderIdParam);

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid or missing orderId in callback URL" });
      }

      await initiateStkPush.handleCallback(orderId, req.body);
      return res.status(200).json({ message: "Callback processed successfully" });
    } catch (error) {
      console.error("Callback Error:", (error as Error).message);
      return res.status(500).json({ message: "Failed to handle callback" });                                                                                                          
    }                                                                                                                                                                                                           
  },
};

//Get Payment Status Controller                                                                                                 
export const getPaymentStatusController: RequestHandler = async (
  req: Request,
  res: Response                                                                                                                                                               
): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId || isNaN(Number(orderId))) {
      res.status(400).json({ success: false, message: "Invalid or missing orderId" });
      return;
    }

    const payment = await getPaymentStatus(Number(orderId));

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get Payment Status Error:", (error as Error).message);
    res.status(500).json({ success: false, message: "Failed to get payment status" });
  }
};
