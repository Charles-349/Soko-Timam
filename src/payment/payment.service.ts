import axios from "axios";
import { eq } from "drizzle-orm";
import db from "../Drizzle/db";
import { payments, orders } from "../Drizzle/schema";
import { normalizePhoneNumber } from "../utils/normalizePhoneNumber";
import { getAccessToken, generatePassword } from "../utils/helper";

// // Initiate M-Pesa STK Push
// export const initiateStkPush = async ({
//   phoneNumber,
//   amount,
//   orderId,
// }: {
//   phoneNumber: string;
//   amount: number;
//   orderId: number;
// }) => {
//   const normalizedPhone = normalizePhoneNumber(phoneNumber);
//   const token = await getAccessToken();
//   const { password, timestamp } = generatePassword();

//   try {
//     const response = await axios.post(
//       `https://${
//         process.env.MPESA_ENV === "sandbox" ? "sandbox" : "api"
//       }.safaricom.co.ke/mpesa/stkpush/v1/processrequest`,
//       {
//         BusinessShortCode: process.env.MPESA_SHORTCODE,
//         Password: password,
//         Timestamp: timestamp,
//         TransactionType: "CustomerPayBillOnline",
//         Amount: amount,
//         PartyA: normalizedPhone,
//         PartyB: process.env.MPESA_SHORTCODE,
//         PhoneNumber: normalizedPhone,
//         CallBackURL: `${process.env.MPESA_CALLBACK_URL}?orderId=${orderId}`,
//         AccountReference: `Order_${orderId}`,
//         TransactionDesc: "Order Payment",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     // Record pending payment in DB
//     await db.insert(payments).values({
//       orderId,
//       method: "mpesa",
//       amount: amount.toString(),
//       status: "pending",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     return response.data;
//   } catch (error: any) {
//     console.error("STK Push Error:", error?.response?.data || error.message);
//     throw new Error("Failed to initiate STK push");
//   }
// };

// //Handle Safaricom Callback
// export const handleMpesaCallback = async (orderId: number, callbackBody: any) => {
//   const stkCallback = callbackBody?.Body?.stkCallback;

//   if (!stkCallback) {
//     console.error("Invalid callback payload");
//     return;
//   }

//   const resultCode = stkCallback.ResultCode;
//   const resultDesc = stkCallback.ResultDesc;

//   // Payment failed or cancelled
//   if (resultCode !== 0) {
//     await db
//       .update(payments)
//       .set({
//         status: "failed",
//         updatedAt: new Date(),
//         transactionRef: resultDesc,
//       })
//       .where(eq(payments.orderId, orderId));

//     console.log(`Payment for Order ${orderId} failed: ${resultDesc}`);
//     return;
//   }

//   // Payment success
//   const mpesaReceipt = stkCallback.CallbackMetadata?.Item.find(
//     (i: any) => i.Name === "MpesaReceiptNumber"
//   )?.Value;

//   const amountPaid = stkCallback.CallbackMetadata?.Item.find(
//     (i: any) => i.Name === "Amount"
//   )?.Value;

//   await db
//     .update(payments)
//     .set({
//       status: "paid",
//       transactionRef: mpesaReceipt,
//       amount: amountPaid,
//       updatedAt: new Date(),
//     })
//     .where(eq(payments.orderId, orderId));

//   // Update order status to “paid”
//   await db
//     .update(orders)
//     .set({
//       status: "paid",
//       paymentStatus: "paid",
//       updatedAt: new Date(),
//     })
//     .where(eq(orders.id, orderId));

//   console.log(`Payment success: Order ${orderId} marked as paid`);
// };


// Combined M-Pesa STK Push + Callback Service
export const initiateStkPush = {
  // Initiate STK Push
  initiate: async ({
    phoneNumber,
    amount,
    orderId,
  }: {
    phoneNumber: string;
    amount: number;
    orderId: number;
  }) => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const token = await getAccessToken();
    const { password, timestamp } = generatePassword();

    try {
      const response = await axios.post(
        `https://${
          process.env.MPESA_ENV === "sandbox" ? "sandbox" : "api"
        }.safaricom.co.ke/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: normalizedPhone,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: normalizedPhone,
          CallBackURL: `${process.env.MPESA_CALLBACK_URL}?orderId=${orderId}`,
          AccountReference: `Order_${orderId}`,
          TransactionDesc: "Order Payment",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      //Record pending payment
      await db.insert(payments).values({
        orderId,
        method: "mpesa",
        amount: amount.toString(),
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return response.data;
    } catch (error: any) {
      console.error(" STK Push Error:", error?.response?.data || error.message);
      throw new Error("Failed to initiate STK push");
    }
  },

  // Handle Safaricom Callback
  handleCallback: async (orderId: number, callbackBody: any) => {
    const stkCallback = callbackBody?.Body?.stkCallback;

    if (!stkCallback) {
      console.error("Invalid callback payload");
      return;
    }

    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    //Common failure reasons
    const cancelledCodes = [1032]; // User cancelled
    const timeoutCodes = [1, 1001]; // Timeout / insufficient balance / error
    const insufficientFunds = [2001, 2006, 4001]; // Insufficient balance errors

    //Handle payment failures or cancellations
    if (resultCode !== 0) {
      let status: "paid" | "unpaid" | "failed" = "failed";

      if (cancelledCodes.includes(resultCode)) {
        // map cancelled to an allowed DB paymentStatus value
        status = "failed";
      } else if (timeoutCodes.includes(resultCode)) {
        // map timeouts to an allowed DB paymentStatus value
        status = "failed";
      } else if (insufficientFunds.includes(resultCode)) {
        status = "failed";
      }

      await db
        .update(payments)
        .set({
          status,
          updatedAt: new Date(),
          transactionRef: resultDesc,
        })
        .where(eq(payments.orderId, orderId));

      await db
        .update(orders)
        .set({
          status: "cancelled",
          paymentStatus: status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`Payment for Order ${orderId} ${status}: ${resultDesc}`);
      return;
    }

    // Successful Payment
    const mpesaReceipt = stkCallback.CallbackMetadata?.Item.find(
      (i: any) => i.Name === "MpesaReceiptNumber"
    )?.Value;

    const amountPaid = stkCallback.CallbackMetadata?.Item.find(
      (i: any) => i.Name === "Amount"
    )?.Value;

    await db
      .update(payments)
      .set({
        status: "paid",
        transactionRef: mpesaReceipt,
        amount: amountPaid,
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, orderId));

    await db
      .update(orders)
      .set({
        status: "paid",
        paymentStatus: "paid",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`Payment success: Order ${orderId} marked as paid`);
  },
};


//Get Payment Status
export const getPaymentStatus = async (orderId: number) => {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
  });

  if (!payment) throw new Error("Payment not found");
  return payment;
};
