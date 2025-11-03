import db from "../Drizzle/db";
import { flashSales } from "../Drizzle/schema";
import { lt, gt, and } from "drizzle-orm";
import { getIo } from "../socket"; 

export const updateFlashSaleStatuses = async () => {
  const now = new Date();
  const io = getIo(); 

  // Get all flash sales before updating to detect status changes
  const allSales = await db.select().from(flashSales);

  // Update statuses based on current time
  await db
    .update(flashSales)
    .set({ flash_sale_status: "active" })
    .where(and(lt(flashSales.startTime, now), gt(flashSales.endTime, now)));

  await db
    .update(flashSales)
    .set({ flash_sale_status: "upcoming" })
    .where(gt(flashSales.startTime, now));

  await db
    .update(flashSales)
    .set({ flash_sale_status: "ended" })
    .where(lt(flashSales.endTime, now));

  // Fetch updated records
  const updatedSales = await db.select().from(flashSales);

  // Compare and emit only when status changes
  allSales.forEach((sale) => {
    const updated = updatedSales.find((u) => u.id === sale.id);
    if (!updated) return;

    if (sale.flash_sale_status !== updated.flash_sale_status) {
      if (updated.flash_sale_status === "active") {
        io.emit("flashSaleStarted", updated);
        console.log(`Flash Sale Started: ${updated.id}`);
      } else if (updated.flash_sale_status === "ended") {
        io.emit("flashSaleEnded", updated);
        console.log(`Flash Sale Ended: ${updated.id}`);
      }
    }
  });

  console.log(`[FlashSaleScheduler] Statuses updated at ${now.toISOString()}`);
};
