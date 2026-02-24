import http from 'http';
import dotenv from 'dotenv/config';
import app from './index';
import { initSocket } from './socket'; 
import { updateFlashSaleStatuses } from './utils/flashsale.schedular';
import cron from 'node-cron';

// Create HTTP server and attach socket
const server = http.createServer(app);
initSocket(server);

const PORT = 8080;
server.listen(PORT, async () => {
  console.log(`Server running on port http://localhost:${PORT}`);

  // Initial flash sale update
  await updateFlashSaleStatuses();

  // Schedule flash sale updates every minute
  cron.schedule("* * * * *", async () => {
    try {
      await updateFlashSaleStatuses();
    } catch (error) {
      console.error("[FlashSaleScheduler] Error:", error);
    }
  });
});
