import { eq } from "drizzle-orm";
import db from "../../Drizzle/db";
import { returns } from "../../Drizzle/schema";

export const processReturn = async (
  returnId: number,
  handler: (returnRecord: any) => Promise<any>
) => {

  const [returnRecord] = await db
    .select()
    .from(returns)
    .where(eq(returns.id, returnId));

  if (!returnRecord)
    throw new Error(`Return ${returnId} not found`);

  const allowedStatuses = ["received"];

if (!allowedStatuses.includes(returnRecord.status)) {
  throw new Error(`Return ${returnId} must be received before processing`);
}

  const result = await handler(returnRecord);

  return result;
};