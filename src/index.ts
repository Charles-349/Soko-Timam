import express from 'express';
import cors from 'cors';
import googleRouter from './auth/google.router';
import user from './user/user.router';
import product from './product/product.router';
import shop from './shop/shop.router';
import category from './category/category.router';
import cart from './cart/cart.router';
import wishlist from './wishlist/wishlist.router';
// import shipping from './shipping/shipping.router';
import logistics from './logistics/logistics.router';
import review from './reviews/reviews.router';
import productAttribute from './productattribute/productattribute.router';
import productImage from './productimage/productimage.router';
import notification from './notification/notification.router';
import flashsales from './flashsales/flashsales.routere';
import coupon from './coupons/coupon.router';
import seller from './seller/seller.router';
import bank from './bank/bank.router';
import mail from './mail/mail.router';
import payment from './payment/payment.router';
import order from './order/order.router';
import { v2 as cloudinary } from 'cloudinary';
import sellerWallet from './wallet/wallet.router';

const app = express();

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", googleRouter);
user(app);
product(app);
shop(app);
category(app);
cart(app);
wishlist(app);
// shipping(app);
review(app);
productAttribute(app);
productImage(app);
notification(app);
flashsales(app);
coupon(app);
seller(app);
bank(app);
mail(app);
payment(app);
order(app);
sellerWallet(app);  
logistics(app);      

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('cloudinary config', cloudinary.config());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

export default app;


// import express from 'express';
// import http from 'http';
// import cors from 'cors';
// import cron from 'node-cron';
// import { initSocket } from './socket'; 
// import { updateFlashSaleStatuses } from './utils/flashsale.schedular'; 
// import googleRouter from './auth/google.router';
// import user from './user/user.router';
// import product from './product/product.router';
// import shop from './shop/shop.router';
// import category from './category/category.router';
// import cart from './cart/cart.router';
// import wishlist from './wishlist/wishlist.router';
// import shipping from './shipping/shipping.router';
// import review from './reviews/reviews.router';
// import productAttribute from './productattribute/productattribute.router';
// import productImage from './productimage/productimage.router';
// import notification from './notification/notification.router';
// import flashsales from './flashsales/flashsales.routere';
// import coupon from './coupons/coupon.router';
// import seller from './seller/seller.router';
// import bank from './bank/bank.router';
// import mail from './mail/mail.router';
// import payment from './payment/payment.router';
// import order from './order/order.router';
// import { v2 as cloudinary } from 'cloudinary';
 
// // Initialize app and server
// const app = express();
// const server = http.createServer(app);
 
// // Initializing Socket.io via initSocket which will attach to the HTTP server
// initSocket(server);
 
// // Middleware
// app.use(
//   cors({
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   })
// );
// app.use(express.json());
 
// // Routes
// app.use("/api/auth", googleRouter);
// user(app);
// product(app);
// shop(app);
// category(app);
// cart(app);
// wishlist(app);
// shipping(app);
// review(app);
// productAttribute(app);
// productImage(app);
// notification(app);
// flashsales(app);
// coupon(app);
// seller(app);
// bank(app);
// mail(app);
// payment(app);
// order(app);
 
// // Cloudinary config
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });
// console.log('cloudinary config', cloudinary.config());
 
// // Root route
// app.get('/', (req, res) => {
//   res.send('Welcome to the API');
// });
 
// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, async() => {
//   console.log(`Server running on port ${PORT}`);

//   //Schedule Flash Sale Status Updates
//   console.log('Starting Flash Sale Scheduler...');
//    // Initial run when the server starts
//   await updateFlashSaleStatuses();

//   // Schedule Flash Sale Status Updates (every 1 minute)
//   cron.schedule("* * * * *", async () => {
//     try {
//       await updateFlashSaleStatuses();
//     } catch (error) {
//       console.error("[FlashSaleScheduler] Error:", error);
//     }
//   });
// });
// // Export app and server 
// export { app, server };
// export default app;
