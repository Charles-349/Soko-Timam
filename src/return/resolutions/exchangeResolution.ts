import { eq, sql } from "drizzle-orm";
import { orderItems, returns, shipping, orders, users } from "../../Drizzle/schema";
import db from "../../Drizzle/db";

export const exchangeResolution = async (returnRecord: any) => {
  // Get original order item
  const [originalItem] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, returnRecord.orderItemId));

  if (!originalItem) throw new Error("Original order item not found");

  // Fetch order and items
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, returnRecord.orderId),
    with: { items: true },
  });

  if (!order) throw new Error("Order not found");

  // Fetch customer
  const customer = await db.query.users.findFirst({
    where: eq(users.id, order.userId),
  });

  if (!customer) throw new Error("Customer not found");

  let replacementOrderId = order.id;

  // Check if multi-item order and partial return
  const totalOrderItems = order.items.length;
  const returnedItemsCount = order.items.filter(
    (item) => item.id === returnRecord.orderItemId
  ).length;

  const isPartialReturn = totalOrderItems > 1 && returnedItemsCount < totalOrderItems;

  // Create new replacement order if partial return
  if (isPartialReturn) {
    const replacementOrderResult = await db.insert(orders).values({
      userId: order.userId,
      status: "paid",
      paymentStatus: "paid",
      replacementOfOrderId: order.id,
      isReplacement: true,
      pickupStationId: order.pickupStationId,
      pickupAgentId: order.pickupAgentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const replacementOrder = Array.isArray(replacementOrderResult)
      ? replacementOrderResult[0]
      : undefined;

    if (!replacementOrder) throw new Error("Replacement order creation failed");

    replacementOrderId = replacementOrder.id;
  }

  // Create replacement order item
  const replacementResult = await db
    .insert(orderItems)
    .values({
      orderId: replacementOrderId,
      productId: originalItem.productId,
      quantity: returnRecord.quantity,
      price: originalItem.price,
      shopId: originalItem.shopId,
      replacementForReturnId: returnRecord.id,
    })
    .returning();

  const replacementItem = Array.isArray(replacementResult)
    ? replacementResult[0]
    : undefined;

  if (!replacementItem) throw new Error("Replacement order item creation failed");

  // Create replacement shipment
  const [shipment] = await db
    .insert(shipping)
    .values({
      orderId: replacementOrderId,
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

  // Update return record
  await db
    .update(returns)
    .set({
      status: "exchanged",
      replacementShipmentId: shipment.id,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(returns.id, returnRecord.id));

  // Reduce escrow if applicable
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