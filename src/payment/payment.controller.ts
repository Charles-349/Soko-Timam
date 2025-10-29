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
import { initiateStkPush, handleMpesaCallback, getPaymentStatus } from "./payment.service";
import { io } from "../index";

// STK Push Controller
export const stkPushController: RequestHandler = async (req, res) => {
  console.log("stkPushController called!");
  try {
    const { phoneNumber, amount, orderId } = req.body;

    if (!phoneNumber || !amount || !orderId) {
      res.status(400).json({
        success: false,
        message: "Missing required fields (phoneNumber, amount, orderId)",
      });
      return;
    }

    const data = await initiateStkPush({
      phoneNumber,
      amount: Number(amount),
      orderId: Number(orderId),
    });

    res.status(200).json({
      success: true,
      message: "STK Push initiated successfully",
      data,
    });
  } catch (error) {
    console.error("STK Push Error:", (error as Error).message);
    res.status(500).json({ success: false, message: "STK push failed" });
  }
};

// Safaricom Callback Controller (handles paid, failed, cancelled)
export const mpesaCallbackController: RequestHandler = async (req, res) => {
  try {
    const orderIdParam = req.query.orderId;
    const orderId = Number(orderIdParam);

    if (isNaN(orderId)) {
      res.status(400).json({ message: "Invalid or missing orderId in callback URL" });
      return;
    }

    // Process the callback (updates DB)
    const result = await handleMpesaCallback(orderId, req.body);

    // Detect payment outcome
    const stkCallback = req.body?.Body?.stkCallback;
    const resultCode = stkCallback?.ResultCode;
    const resultDesc = stkCallback?.ResultDesc || "Unknown error";

    let status = "pending";
    let message = "";

    if (resultCode === 0) {
      status = "paid";
      message = "Payment confirmed successfully";
    } else if (resultCode === 1032) {
      status = "cancelled";
      message = "Payment cancelled by user";
    } else if ([1, 1001, 2001, 2006, 4001].includes(resultCode)) {
      status = "failed";
      message = "Payment failed or insufficient funds";
    } else {
      status = "failed";
      message = resultDesc;
    }

    //Emit real-time update to frontend
    io.emit("payment_update", {
      orderId,
      status,
      message,
    });

    res.status(200).json({ message: "Callback processed successfully" });
  } catch (error) {
    console.error("Callback Error:", (error as Error).message);
    res.status(500).json({ message: "Failed to handle callback" });
  }
};

// Get Payment Status Controller
export const getPaymentStatusController: RequestHandler = async (req, res) => {
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
