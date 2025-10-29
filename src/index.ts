
// import express from 'express';
// import user from './user/user.router';
// import product from './product/product.router';
// import cors from 'cors';
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
// import {v2 as cloudinary} from 'cloudinary';
// import seller from './seller/seller.router';
// import bank from './bank/bank.router';
// import mail from './mail/mail.router';
// import payment from './payment/payment.router';
// import order from './order/order.router';

// const initializeApp = ()=>{
// const app = express();

// //middleware
// app.use(cors({
//         origin: '*',
//         methods: ["GET", "POST", "PUT", "DELETE"],
//     }))


// app.use(express.json());


// //routes
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



// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });
// console.log("cloudinary config", cloudinary.config());


// app.get('/', (req, res) => {
//     res.send('Welcome to the Hospital API');
// }
// )
// return app

// }
// const app = initializeApp()
// export default app



import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import user from './user/user.router';
import product from './product/product.router';
import shop from './shop/shop.router';
import category from './category/category.router';
import cart from './cart/cart.router';
import wishlist from './wishlist/wishlist.router';
import shipping from './shipping/shipping.router';
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

// Initialize app and server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json());

// Routes
user(app);
product(app);
shop(app);
category(app);
cart(app);
wishlist(app);
shipping(app);
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

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('cloudinary config', cloudinary.config());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Butchery API');
});

// Socket connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//Export both for external use (tests, imports, etc.)
export { app, server };
export default app;
