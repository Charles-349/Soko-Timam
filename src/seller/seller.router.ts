
import { customerRoleAuth } from "../middleware/bearAuth";
import { 
  createSeller
} from "./seller.controller";
import { Express } from "express";

const seller = (app: Express) => {
  // Register Seller
  app.route("/seller/register").post(customerRoleAuth,async (req, res, next) => {  
    try {
      await createSeller(req, res);
    } catch (error) {
      next(error);
    }
  });
} 
export default seller;                                                                                                                                      