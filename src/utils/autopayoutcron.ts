import { autoPayoutService } from "../wallet/wallet.service";
import cron from "node-cron";

// Runs every day at 2:00 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running daily auto-payout job...");
  await autoPayoutService();
});
