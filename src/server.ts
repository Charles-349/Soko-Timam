
import app from "./index";
import dotenv from 'dotenv/config';


const PORT =8080;
app.listen(PORT, () => {

    console.log(`Server is running on port http://localhost:${PORT}`);
}) 