
import express from 'express';
import user from './user/user.router';
import product from './product/product.router';
const initializeApp = ()=>{
const app = express();

//middleware
app.use(express.json());


//routes
user(app);
product(app);

app.get('/', (req, res) => {
    res.send('Welcome to the Hospital API');
}
)
return app

}
const app = initializeApp()
export default app


