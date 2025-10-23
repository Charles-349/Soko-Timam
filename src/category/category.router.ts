// import { adminRoleAuth } from "../middleware/bearAuth";
// import {
//   createCategoryController,
//   // getMainCategoriesController,
//   // getSubCategoriesByParentIdController,
//   getCategoriesController,
//   getCategoryByIdController,
//   updateCategoryController,
//   deleteCategoryController,
//   getCategoryWithProductsController,
//   getCategoriesBySellerIdController,
//   getCategoriesByShopIdController,
//   getCategoriesBySellerAndShopIdController,
// } from "./category.controller";
// import { Express } from "express";

// const category = (app: Express) => {
//   // Create Category 
//   app.route("/category").post( async (req, res, next) => {
//     try {
//       await createCategoryController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });

//   // Get All Categories
//   app.route("/category").get(async (req, res, next) => {
//     try {
//       await getCategoriesController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });

//   // Get Category by ID
//   app.route("/category/:id").get(async (req, res, next) => {
//     try {
//       await getCategoryByIdController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });

//   // Update Category by ID 
//   app.route("/category/:id").put( async (req, res, next) => {
//     try {
//       await updateCategoryController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });

//   // Delete Category by ID 
//   app.route("/category/:id").delete( async (req, res, next) => {
//     try {
//       await deleteCategoryController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });

//   // JOINS: Category with Products
//   app.route("/category/:id/products").get(async (req, res, next) => {
//     try {
//       await getCategoryWithProductsController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });

//   //Get Categories by Shop ID
//   app.route("/shop/:shopId/categories").get(async (req, res, next) => {
//     try {
//       await getCategoriesByShopIdController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });

//   //Get Categories by Seller ID (across multiple shops)
//   app.route("/seller/:sellerId/categories").get(async (req, res, next) => {
//     try {
//       await getCategoriesBySellerIdController(req, res);
//     } catch (error) {
//       next(error);
//     }
//   });
// //get categories for a specific seller in a specific shop
// app.route("/seller/:sellerId/shop/:shopId/categories").get(async (req, res, next) => {
//   try {
//     await getCategoriesBySellerAndShopIdController(req, res);
//   } catch (error) {
//     next(error);
//   }
// });

// };
// export default category;


import { Express } from "express";
import {
  createCategoryController,
  getCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
  getCategoryWithProductsController,
  getCategoriesByShopIdController,
  getCategoriesBySellerIdController,
  getCategoriesBySellerAndShopIdController,
} from "./category.controller";


const category = (app: Express) => {
  // Create Category 
  app.post("/category", async (req, res, next) => {
    try {
      await createCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get All Categories
  app.get("/category", async (req, res, next) => {
    try {
      await getCategoriesController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Category by ID
  app.get("/category/:id", async (req, res, next) => {
    try {
      await getCategoryByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Update Category by ID 
  app.put("/category/:id",async (req, res, next) => {
    try {
      await updateCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Delete Category by ID 
  app.delete("/category/:id",async (req, res, next) => {
    try {
      await deleteCategoryController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Category with Products
  app.get("/category/:id/products", async (req, res, next) => {
    try {
      await getCategoryWithProductsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get Categories by Shop ID
  app.get("/shop/:shopId/categories", async (req, res, next) => {
    try {
      await getCategoriesByShopIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get Categories by Seller ID (across multiple shops)
  app.get("/seller/:sellerId/categories", async (req, res, next) => {
    try {
      await getCategoriesBySellerIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  //Get Categories for a specific Seller in a specific Shop
  app.get("/seller/:sellerId/shop/:shopId/categories", async (req, res, next) => {
    try {
      await getCategoriesBySellerAndShopIdController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default category;
