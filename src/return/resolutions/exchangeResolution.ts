
import { eq } from "drizzle-orm";
import db from "../../Drizzle/db";
import { orderItems, orders, returns, shipping, users } from "../../Drizzle/schema";
import { sql } from "drizzle-orm";

export const exchangeResolution = async (returnRecord: any) => {

  //Get original item
  const [originalItem] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, returnRecord.orderItemId));

  if (!originalItem) throw new Error("Original order item not found");

  //Get original order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, returnRecord.orderId),
  });

  if (!order) throw new Error("Order not found");

  //Get customer
  const customer = await db.query.users.findFirst({
    where: eq(users.id, order.userId),
  });

  if (!customer) throw new Error("Customer not found");

  //ALWAYS create new replacement order
  const replacementOrderResult = await db.insert(orders).values({
    userId: order.userId,
    status: "paid",
    paymentStatus: "paid",
    replacementOfOrderId: order.id,
    isReplacement: true,
    originStationId: order.originStationId,
    pickupStationId: order.pickupStationId,
    pickupAgentId: order.pickupAgentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  const replacementOrder = replacementOrderResult[0];
  if (!replacementOrder) throw new Error("Replacement order creation failed");

  //Create replacement item
  const replacementResult = await db
    .insert(orderItems)
    .values({
      orderId: replacementOrder.id,
      productId: originalItem.productId,
      quantity: returnRecord.quantity,
      price: originalItem.price,
      shopId: originalItem.shopId,
      replacementForReturnId: returnRecord.id,
    })
    .returning();

  const replacementItem = replacementResult[0];
  if (!replacementItem) throw new Error("Replacement item creation failed");

  //Create shipment 
  const [shipment] = await db
    .insert(shipping)
    .values({
      orderId: replacementOrder.id,
      orderItemId: replacementItem.id,
      recipientName: `${customer.firstname} ${customer.lastname}`,
      recipientPhone: customer.phone ?? null,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      originStationId: order.originStationId,
      pickupStationId: order.pickupStationId || null,
      pickupAgentId: order.pickupAgentId || null,
      type: "replacement",
      status: "preparing",
      createdAt: new Date(),
    })
    .returning();

  //Update return record
  await db
    .update(returns)
    .set({
      status: "exchanged",
      replacementShipmentId: shipment.id,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(returns.id, returnRecord.id));

  //Handle escrow 
  if (returnRecord.refundAmount && Number(returnRecord.refundAmount) > 0) {
    const refundAmount = Number(returnRecord.refundAmount);

    await db
      .update(orders)
      .set({
        escrowLockedAmount: sql`${orders.escrowLockedAmount} - ${refundAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
    });

    if (updatedOrder && Number(updatedOrder.escrowLockedAmount) <= 0) {
      await db
        .update(orders)
        .set({
          isEscrowLocked: false,
          escrowLockedAmount: "0",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    }
  }

  return replacementItem;
};