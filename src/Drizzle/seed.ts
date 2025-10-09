
// import db from "./db";
// import {
//   users,
//   shops,
//   categories,
//   products,
//   productImages,
//   productAttributes,
//   carts,
//   cartItems,
//   wishlists,
//   orders,
//   orderItems,
//   payments,
//   shipping,
//   reviews,
//   coupons,
//   flashSales,
//   notifications,
//   auditLogs,
// } from "./schema";

// async function seed() {
//   console.log("Starting seed...");

//   // USERS 
//   const [adminUser, vendorUser, customerUser] = await db
//     .insert(users)
//     .values([
//       {
//         firstname: "Admin",
//         lastname: "User",
//         email: "admin@example.com",
//         password: "hashedpassword",
//         role: "admin",
//         isVerified: true,
//       },
//       {
//         firstname: "Vendor",
//         lastname: "User",
//         email: "vendor@example.com",
//         password: "hashedpassword",
//         role: "vendor",
//         isVerified: true,
//       },
//       {
//         firstname: "Customer",
//         lastname: "User",
//         email: "customer@example.com",
//         password: "hashedpassword",
//         role: "customer",
//         isVerified: true,
//       },
//     ])
//     .returning();

//   // SHOPS 
//   const [shop1] = await db
//     .insert(shops)
//     .values({
//       ownerId: vendorUser.id,
//       name: "Tech World",
//       description: "Electronics and gadgets",
//       status: "active",
//       rating: "4.5",
//     })
//     .returning();

//   // CATEGORIES 
//   const [electronicsCategory, phonesCategory] = await db
//     .insert(categories)
//     .values([
//       { name: "Electronics" },
//       { name: "Phones", parentId: 1 }, // subcategory
//     ])
//     .returning();

//   //  PRODUCTS 
//   const [product1, product2] = await db
//     .insert(products)
//     .values([
//       {
//         shopId: shop1.id,
//         categoryId: electronicsCategory.id,
//         name: "Laptop Pro X",
//         description: "High performance laptop",
//         price: "1200.00",
//         stock: 10,
//         sku: "LAPTOP-123",
//       },
//       {
//         shopId: shop1.id,
//         categoryId: phonesCategory.id,
//         name: "Smartphone Z",
//         description: "Latest smartphone model",
//         price: "800.00",
//         stock: 20,
//         sku: "PHONE-456",
//       },
//     ])
//     .returning();

//   // PRODUCT IMAGES 
//   await db.insert(productImages).values([
//     { productId: product1.id, imageUrl: "https://via.placeholder.com/300", isMain: true },
//     { productId: product2.id, imageUrl: "https://via.placeholder.com/300", isMain: true },
//   ]);

//   //  PRODUCT ATTRIBUTES 
//   await db.insert(productAttributes).values([
//     { productId: product1.id, key: "RAM", value: "16GB" },
//     { productId: product1.id, key: "Storage", value: "512GB SSD" },
//     { productId: product2.id, key: "Color", value: "Black" },
//   ]);

//   // CARTS & ITEMS 
//   const [cart1] = await db
//     .insert(carts)
//     .values({ userId: customerUser.id })
//     .returning();

//   await db.insert(cartItems).values({
//     cartId: cart1.id,
//     productId: product1.id,
//     quantity: 1,
//   });

//   //  WISHLISTS 
//   await db.insert(wishlists).values({
//     userId: customerUser.id,
//     productId: product2.id,
//   });

//   // ORDERS 
//   const [order1] = await db
//     .insert(orders)
//     .values({
//       userId: customerUser.id,
//       status: "pending",
//       totalAmount: "1200.00",
//       shippingAddress: "123 Main St",
//     })
//     .returning();

//   await db.insert(orderItems).values({
//     orderId: order1.id,
//     productId: product1.id,
//     shopId: shop1.id,
//     quantity: 1,
//     price: "1200.00",
//   });

//   // PAYMENTS 
//   await db.insert(payments).values({
//     orderId: order1.id,
//     method: "mpesa",
//     amount: "1200.00",
//     status: "paid",
//     transactionRef: "TXN12345",
//   });

//   // SHIPPING 
//   await db.insert(shipping).values({
//     orderId: order1.id,
//     courier: "DHL",
//     trackingNumber: "TRACK123",
//     status: "dispatched",
//   });

//   // REVIEWS 
//   await db.insert(reviews).values({
//     productId: product1.id,
//     userId: customerUser.id,
//     rating: 5,
//     comment: "Excellent product!",
//   });

//   //  COUPONS 
//   await db.insert(coupons).values({
//     code: "WELCOME10",
//     discountPercent: 10,
//     expiryDate: new Date("2025-12-31"),
//   });

//   // FLASH SALES 
//   await db.insert(flashSales).values({
//     productId: product2.id,
//     discountPercent: 20,
//     discountPrice: "640.00",
//     stockLimit: 5,
//     startTime: new Date(),
//     endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
//     status: "active",
//   });

//   // NOTIFICATIONS 
//   await db.insert(notifications).values({
//     userId: customerUser.id,
//     message: "Your order has been dispatched!",
//     type: "order",
//   });

//   // AUDIT LOGS 
//   await db.insert(auditLogs).values({
//     userId: adminUser.id,
//     action: "SEED_RUN",
//     details: "Database seeded with initial data",
//   });

//   console.log("Seeding completed successfully!");
// }

// seed().catch((err) => {
//   console.error("Seeding failed", err);
//   process.exit(1);
// });
