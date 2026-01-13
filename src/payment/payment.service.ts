// import axios from "axios";
// import { eq } from "drizzle-orm";
// import db from "../Drizzle/db";
// import { payments, orders, cartItems, carts } from "../Drizzle/schema";
// import { normalizePhoneNumber } from "../utils/normalizePhoneNumber";
// import { getAccessToken, generatePassword } from "../utils/helper";

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

//     const order = await db.query.orders.findFirst({
//     where: eq(orders.id, orderId),
//   });

//   if (!order) {
//     console.error(`Order ${orderId} not found`);
//     return;
//   }
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

//       await db
//       .update(orders)
//       .set({
//         status: "cancelled",
//         paymentStatus: "failed",
//         updatedAt: new Date(),
//       })
//       .where(eq(orders.id, orderId));
//        console.log(`Payment for Order ${orderId} failed: ${resultDesc}`);
//        return;
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
//      //Delete user's unpaid cart (after successful payment)
//      await db.delete(carts).where(eq(carts.userId, order.userId));

//        //Create shipping record (full details)
//   // await db.insert(shipping).values({
//   //   orderId: order.id,
//   //   courier: "Pending Assignment", 
//   //   trackingNumber: null,
//   //   status: "preparing",
//   //   recipientName: order.recipientName,     
//   //   recipientPhone: order.recipientPhone,   
//   //   address: order.address,                 
//   //   estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days estimate
//   //   createdAt: new Date(),
//   // });
//      console.log(`Payment success: Order ${orderId} marked as paid`);
   
// };

// //Get Payment Status
// export const getPaymentStatus = async (orderId: number) => {
//   const payment = await db.query.payments.findFirst({
//     where: eq(payments.orderId, orderId),
//   });

//   if (!payment) throw new Error("Payment not found");
//   return payment;
// };




import axios from "axios";
import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { payments, orders, cartItems, carts, orderItems, sellerWallets, sellerWalletTransactions, shops, platformCommissions } from "../Drizzle/schema";
import { normalizePhoneNumber } from "../utils/normalizePhoneNumber";
import { getAccessToken, generatePassword } from "../utils/helper";
import { TISellerWallet } from "../Drizzle/schema"; 
import { randomUUID } from "crypto";


// Initiate M-Pesa STK Push
export const initiateStkPush = async ({
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

    // Record pending payment in DB
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
    console.error("STK Push Error:", error?.response?.data || error.message);
    throw new Error("Failed to initiate STK push");
  }
};

//Handle Safaricom Callback
export const handleMpesaCallback = async (orderId: number, callbackBody: any) => {
  const stkCallback = callbackBody?.Body?.stkCallback;

  if (!stkCallback) {
    console.error("Invalid callback payload");
    return;
  }

  const resultCode = stkCallback.ResultCode;
  const resultDesc = stkCallback.ResultDesc;

    const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    console.error(`Order ${orderId} not found`);
    return;
  }
  // Payment failed or cancelled
  if (resultCode !== 0) {
    await db
      .update(payments)
      .set({
        status: "failed",
        updatedAt: new Date(),
        transactionRef: resultDesc,
      })
      .where(eq(payments.orderId, orderId));

      await db
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
       console.log(`Payment for Order ${orderId} failed: ${resultDesc}`);
       return;
  }
  

  // Payment success
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

  // Update order status to “paid”
  await db
    .update(orders)
    .set({
      status: "paid",
      paymentStatus: "paid",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Delete user's cart after successful payment
  await db.delete(carts).where(eq(carts.userId, order.userId));

  // SELLER SPLIT / WALLET LOGIC
  try {
    const items: Array<any> = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    const earningsByShop: Record<number, number> = {};

    for (const it of items) {
      const price = Number(it.price);
      const qty = Number(it.quantity);
      const shopId = Number(it.shopId);
      const lineTotal = price * qty;

      if (!earningsByShop[shopId]) earningsByShop[shopId] = 0;
      earningsByShop[shopId] += lineTotal;
    }

    const COMMISSION_PERCENT = process.env.MARKETPLACE_COMMISSION ? Number(process.env.MARKETPLACE_COMMISSION) : 10;

    for (const shopIdStr of Object.keys(earningsByShop)) {
      const shopId = Number(shopIdStr);
      const shopTotal = earningsByShop[shopId];
      const commission = (shopTotal * COMMISSION_PERCENT) / 100;
      const amountToSeller = Number((shopTotal - commission).toFixed(2));

      // Find sellerId 
      const shopRecord: any = await db.query.shops.findFirst({
        where: eq(shops.id, shopId),
      });

      if (!shopRecord) {
        console.warn(`Shop ${shopId} not found while splitting order ${orderId}`);
        continue;
      }

      const sellerId = shopRecord.sellerId;

      // Insert wallet transaction
      await db.insert(sellerWalletTransactions).values({
        sellerId,
        orderId,
        productId: null,
        amount: amountToSeller.toFixed(2),
        type: "credit",
        note: `Order ${orderId} split for shop ${shopId}`,
        walletStatus: "completed",
        createdAt: new Date(),
      });

      // Update or create seller wallet
      const wallet = await db.query.sellerWallets.findFirst({
        where: eq(sellerWallets.sellerId, sellerId),
      });

      if (wallet) {
        await db.update(sellerWallets).set({
          balance: sql`${sellerWallets.balance} + ${amountToSeller}`,
          totalEarned: sql`${sellerWallets.totalEarned} + ${amountToSeller}`,
          updatedAt: new Date(),
        }).where(eq(sellerWallets.sellerId, sellerId));
      } else {
      const newWallet: TISellerWallet = {
      sellerId,
      balance: amountToSeller.toFixed(2),      
      totalEarned: amountToSeller.toFixed(2),  
      pendingWithdrawal: "0",                  
      createdAt: new Date(),
      updatedAt: new Date(),
};

await db.insert(sellerWallets).values(newWallet);

      }
      // Persist platform commission
      await db.insert(platformCommissions).values({
        orderId,
        shopId,
        sellerId,
        commission: commission.toFixed(2),
        createdAt: new Date(),
      });
    }
  } catch (splitError: any) {
    console.error("Error during seller split processing for order", orderId, splitError?.message || splitError);
  }

  console.log(`Payment success: Order ${orderId} marked as paid`);
};

//Get Payment Status
export const getPaymentStatus = async (orderId: number) => {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
  });

  if (!payment) throw new Error("Payment not found");
  return payment;
};

// PAY SELLER VIA M-PESA
// export const paySellerViaMpesa = async (phone: string, amount: number) => {
//   const token = process.env.MPESA_B2C_TOKEN;

//   const payload = {
//     InitiatorName: process.env.MPESA_INITIATOR,
//     SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
//     CommandID: "BusinessPayment",
//     Amount: amount,
//     PartyA: process.env.MPESA_B2C_SHORTCODE,
//     PartyB: phone,
//     Remarks: "Withdrawal payout",
//     QueueTimeOutURL: process.env.MPESA_TIMEOUT_URL,
//     ResultURL: process.env.MPESA_RESULT_URL,
//   };

//   const response = await axios.post(
//     "https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest",
//     payload,
//     { headers: { Authorization: `Bearer ${token}` } }
//   );

//   return response.data;
// };

export const paySellerViaMpesa = async (phone: string, amount: number) => {
  const token = await getB2CAccessToken();
  if (!token) throw new Error("Missing MPESA_B2C_TOKEN");

  const originatorConversationID = randomUUID().replace(/-/g, "").slice(0, 32);
  const payload = {
    OriginatorConversationID: originatorConversationID,
    InitiatorName: process.env.MPESA_INITIATOR,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: "BusinessPayment",
    Amount: amount,
    PartyA: process.env.MPESA_B2C_SHORTCODE,
    PartyB: phone,
    Remarks: "Withdrawal payout",
    QueueTimeOutURL: process.env.MPESA_TIMEOUT_URL,
    ResultURL: process.env.MPESA_RESULT_URL,
  };

  try {
    const response = await axios.post(
      process.env.MPESA_ENV === "sandbox"
        ? "https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest"
        : "https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest",
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  }catch (error: any) {
  console.error("B2C Error Full:", JSON.stringify(error?.response?.data, null, 2));
  throw new Error(
    error?.response?.data?.errorMessage ||
    error?.response?.data?.ResponseDescription ||
    "B2C request rejected by Safaricom"
  );
}
}

export const handleB2CTimeoutService = async (callbackBody: any) => {
  console.log("B2C Timeout received:", callbackBody);
  const transactionId = callbackBody?.TransactionID;
  if (transactionId) {
    await db.update(sellerWalletTransactions).set({
      walletStatus: "failed",
      updatedAt: new Date(),
    }).where(eq(sellerWalletTransactions.id, transactionId));
  }
  return { success: true };
};

export const handleB2CResultService = async (callbackBody: any) => {
  console.log("B2C Result received:", callbackBody);

  const result = callbackBody?.Result;
  if (!result) throw new Error("Invalid B2C result payload");

  const phone = result?.ReceiverPartyPublicName || result?.PartyB;
  const amount = Number(result?.TransactionAmount || 0);
  const transactionId = result?.TransactionID;

  if (transactionId) {
    await db.update(sellerWalletTransactions).set({
      walletStatus: result.ResultDesc === "The service request is processed successfully." ? "completed" : "failed",
      updatedAt: new Date(),
    }).where(eq(sellerWalletTransactions.id, transactionId));
  }

  return { success: true, data: result };
};

export const getB2CAccessToken = async () => {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return data.access_token;
};
