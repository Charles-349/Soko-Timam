
import { Request, Response, RequestHandler, NextFunction } from "express";
import { initiateStkPush, handleMpesaCallback, getPaymentStatus, handleB2CResultService, handleB2CTimeoutService, paySellerViaMpesa } from "./payment.service";
import { getIo } from "../socket";
import db from "../Drizzle/db";
import { sellerWalletTransactions } from "../Drizzle/schema";

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
      res.status(400).json({ message: 'Invalid or missing orderId in callback URL' });
      return;
    }
 
    // Process the callback (updates DB)
    const result = await handleMpesaCallback(orderId, req.body);
 
    // Detect payment outcome
    const stkCallback = req.body?.Body?.stkCallback;
    const resultCode = stkCallback?.ResultCode;
    const resultDesc = stkCallback?.ResultDesc || 'Unknown error';
 
    let status = 'pending';
    let message = '';
 
    if (resultCode === 0) {
      status = 'paid';
      message = 'Payment confirmed successfully';
    } else if (resultCode === 1032) {
      status = 'cancelled';
      message = 'Payment cancelled by user';
    } else if ([1, 1001, 2001, 2006, 4001].includes(resultCode)) {
      status = 'failed';
      message = 'Payment failed or insufficient funds';
    } else {
      status = 'failed';
      message = resultDesc;
    }
 
    // Emit real-time update to frontend to the specific room for this order
    try {
      const io = getIo();
      const room = `order_${orderId}`;
      io.to(room).emit('payment_update', {
        orderId,
        status,
        message,
      });
    } catch (emitErr) {
      console.error('Socket emit error:', (emitErr as Error).message);
      // continue — the callback should still return success to the payer
    }
 
    res.status(200).json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Callback Error:', (error as Error).message);
    res.status(500).json({ message: 'Failed to handle callback' });
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

export const handleB2CTimeoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await handleB2CTimeoutService(req.body);
    res.status(200).json({ message: "Timeout received" });
  } catch (error: any) {
    console.error("B2C Timeout Error:", error.message);
    res.status(500).json({ message: "Error handling B2C timeout" });
  }
};


export const paySellerB2CTestController: RequestHandler = async (req, res) => {
  try {
    const { phone, amount, walletTransactionId } = req.body;

    if (!phone || !amount || !walletTransactionId) {
      res.status(400).json({
        success: false,
        message: "phone, amount and walletTransactionId are required",
      });
      return;
    }

    // Trigger B2C using existing wallet transaction
    const b2c = await paySellerViaMpesa(
      Number(walletTransactionId),
      phone,
      Number(amount)
    );

    res.status(200).json({
      success: true,
      message: "B2C payout initiated",
      walletTransactionId,
      externalTransactionId: b2c.externalTransactionId,
      mpesa: b2c.mpesa,
    });
  } catch (error) {
    console.error("B2C Test Controller Error:", (error as Error).message);
    res.status(500).json({
      success: false,
      message: "B2C test failed",
    });
  }
};

export const handleB2CResultController: RequestHandler = async (req, res) => {
  try {
    const result = await handleB2CResultService(req.body);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json({
      message: "B2C result processed",
      transaction: result.transaction,
      walletStatus: result.walletStatus,
    });
  } catch (error) {
    console.error("B2C Result Error:", (error as Error).message);
    res.status(500).json({
      message: "Error handling B2C result",
    });
  }
};

