
import express from 'express';
const initializeApp = ()=>{
const app = express();

//middleware
app.use(express.json());


//routes


app.get('/', (req, res) => {
    res.send('Welcome to the Hospital API');
}
)
return app

}
const app = initializeApp()
export default app


