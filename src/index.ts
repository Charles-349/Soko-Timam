
import express from 'express';
import user from './user/user.router';
import product from './product/product.router';
import cors from 'cors';
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
const initializeApp = ()=>{
const app = express();

//middleware
app.use(cors({
        origin: '*',
        methods: ["GET", "POST", "PUT", "DELETE"],
    }))


app.use(express.json());


//routes
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


app.get('/', (req, res) => {
    res.send('Welcome to the Hospital API');
}
)
return app

}
const app = initializeApp()
export default app



