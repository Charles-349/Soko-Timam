import cron from "node-cron";
import { releaseEscrowSettlementsService } from "../settlement/settlement.service";

export const startSettlementCron = () => {
  // Run every 1 hour
  cron.schedule("0 * * * *", async () => {
    await releaseEscrowSettlementsService();
  });

  console.log("Escrow settlement cron started.");
};