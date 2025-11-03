import db from "../Drizzle/db";
import { flashSales } from "../Drizzle/schema";
import { lt, gt, and } from "drizzle-orm";
import { getIo } from "../socket";

export const updateFlashSaleStatuses = async () => {
  // Get current local time
  const now = new Date();

  // Normalize to system timezone (not UTC)
  const localNow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  const io = getIo();

  console.log(`[FlashSaleScheduler] Checking flash sales at:
  - Local time: ${localNow.toString()}
  - UTC time: ${now.toISOString()}
  `);

  // Fetch all sales before updates for comparison
  const allSales = await db.select().from(flashSales);

  // Update statuses according to system time
  await db
    .update(flashSales)
    .set({ flash_sale_status: "active" })
    .where(and(lt(flashSales.startTime, localNow), gt(flashSales.endTime, localNow)));

  await db
    .update(flashSales)
    .set({ flash_sale_status: "upcoming" })
    .where(gt(flashSales.startTime, localNow));

  await db
    .update(flashSales)
    .set({ flash_sale_status: "ended" })
    .where(lt(flashSales.endTime, localNow));

  // Fetch updated data
  const updatedSales = await db.select().from(flashSales);

  // Emit only for changed statuses
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

  console.log(`[FlashSaleScheduler] Status update completed at ${localNow.toString()}`);
};
