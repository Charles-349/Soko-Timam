import { pgEnum,pgTable, serial, varchar, text, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

//ENUMS
export const RoleEnum = pgEnum("role", ["admin", "vendor", "customer"]); 
export const ShopStatusEnum = pgEnum("status", ["pending", "active", "suspended"]);
export const OrderStatusEnum = pgEnum("order_status", ["pending", "paid", "shipped", "completed", "cancelled"]);
export const PaymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "failed"]); 
export const ShippingStatusEnum = pgEnum("shipping_status", ["preparing", "dispatched", "in-transit", "delivered"]); 
export const FlashSalesStatusEnum = pgEnum("flash_sale_status", ["upcoming", "active", "ended"]);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

// USERS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),                                                                                                                                                                                                                                                                                                                                 
  firstname: varchar("firstname", { length: 255 }).notNull(),
  lastname: varchar("lastname", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: RoleEnum("role").default("customer"), // admin, seller, customer
  image_url: varchar("image_url", { length: 255 }).default(
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
  ),
  isVerified: boolean("is_verified").default(false),
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationCodeExpiresAt: timestamp("verification_code_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fullname: varchar("fullname", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  nationalId: varchar("national_id", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// VENDOR SHOPS                                                                                                                                                                                                                                
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  status: ShopStatusEnum("status").default("pending"), // pending, active, suspended
  primaryCategory: varchar("primary_category", { length: 100 }).notNull(),
  businessType: varchar("business_type", { length: 100 }).notNull(),
  businessRegistrationNumber: varchar("business_registration_number", { length: 100 }),
  kraPin: varchar("kra_pin", { length: 50 }),
  taxId: varchar("tax_id", { length: 50 }),
  postalCode: varchar("postal_code", { length: 20 }),
  logoUrl: text("logo_url"),
  expectedMonthlyOrders: integer("expected_monthly_orders"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountName: varchar("account_name", { length: 100 }).notNull(),
  branchCode: varchar("branch_code", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

//CATEGORIES 
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: integer("parent_id"), 
  createdAt: timestamp("created_at").defaultNow(),
});

//PRODUCTS
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  // sku: varchar("sku", { length: 100 }),
  // status: varchar("status", { length: 20 }).default("active"),
  ImageUrl: text("image_url"),
  // rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  // salesCount: integer("sales_count").default(0),                                                                                                                                                                                                                                                           
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()

});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  imageUrl: text("image_url").notNull(),
  isMain: boolean("is_main").default(false),
});

export const productAttributes = pgTable("product_attributes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
});

// CARTS & WISHLISTS
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
});

// ORDERS
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: OrderStatusEnum("order_status").default("pending"), // pending, paid, shipped, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: PaymentStatusEnum("payment_status").default("unpaid"),
  shippingAddress: text("shipping_address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// PAYMENTS
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  method: varchar("method", { length: 50 }).notNull(), // mpesa, card, wallet
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  transactionRef: varchar("transaction_ref", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()

});

//  SHIPPING
export const shipping = pgTable("shipping", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  courier: varchar("courier", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  status: ShippingStatusEnum("shipping_status").default("preparing"), // preparing, dispatched, in-transit, delivered
  recipientName: varchar("recipient_name", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  address: text("address").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").defaultNow(),
});

// REVIEWS
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), 
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// PROMOTIONS 
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountPercent: integer("discount_percent"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  expiryDate: timestamp("expiry_date"),
  usageLimit: integer("usage_limit"),
  isActive: boolean("is_active").default(true).notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("percent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flashSales = pgTable("flash_sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  discountPercent: integer("discount_percent").notNull(),
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
  stockLimit: integer("stock_limit").default(0),
  soldCount: integer("sold_count").default(0),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  flash_sale_status: FlashSalesStatusEnum("flash_sale_status").default("upcoming"), // upcoming, active, ended
  createdAt: timestamp("created_at").defaultNow(),
});

// NOTIFICATIONS
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("general"), // order, promo, system
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

//ADMIN / AUDIT
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RELATIONS 
export const usersRelations = relations(users, ({ many }) => ({
  shops: many(shops),
  carts: many(carts),
  wishlists: many(wishlists),
  orders: many(orders),
  reviews: many(reviews),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [shops.sellerId],
    references: [sellers.id],
  }),
  products: many(products),
  orderItems: many(orderItems),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    
    references: [shops.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  attributes: many(productAttributes),
  cartItems: many(cartItems),
  wishlists: many(wishlists),
  orderItems: many(orderItems),
  reviews: many(reviews),
  flashSales: many(flashSales),
}));
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));


export const productsDeepRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  reviews: many(reviews),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  shipping: many(shipping),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  shop: one(shops, {
    fields: [orderItems.shopId],
    references: [shops.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const shippingRelations = relations(shipping, ({ one }) => ({
  order: one(orders, {
    fields: [shipping.orderId],
    references: [orders.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const flashSalesRelations = relations(flashSales, ({ one }) => ({
  product: one(products, {
    fields: [flashSales.productId],
    references: [products.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));


// TYPE INFERENCE 
export type TIUser = typeof users.$inferInsert;
export type TSUser = typeof users.$inferSelect;

export type TIShop = typeof shops.$inferInsert;
export type TSShop = typeof shops.$inferSelect;

export type TICategory = typeof categories.$inferInsert;
export type TSCategory = typeof categories.$inferSelect;

export type TIProduct = typeof products.$inferInsert;
export type TSProduct = typeof products.$inferSelect;

export type TIProductImage = typeof productImages.$inferInsert;
export type TSProductImage = typeof productImages.$inferSelect;

export type TIProductAttribute = typeof productAttributes.$inferInsert;
export type TSProductAttribute = typeof productAttributes.$inferSelect;

export type TICart = typeof carts.$inferInsert;
export type TSCart = typeof carts.$inferSelect;

export type TICartItem = typeof cartItems.$inferInsert;
export type TSCartItem = typeof cartItems.$inferSelect;

export type TIWishlist = typeof wishlists.$inferInsert;
export type TSWishlist = typeof wishlists.$inferSelect;

export type TIOrder = typeof orders.$inferInsert;
export type TSOrder = typeof orders.$inferSelect;

export type TIOrderItem = typeof orderItems.$inferInsert;
export type TSOrderItem = typeof orderItems.$inferSelect;

export type TIPayment = typeof payments.$inferInsert;
export type TSPayment = typeof payments.$inferSelect;
export type UpdatePayment = Partial<Omit<TIPayment, 'orderId'>> & { updatedAt?: Date | null };

export type TIShipping = typeof shipping.$inferInsert;
export type TSShipping = typeof shipping.$inferSelect;

export type TIReview = typeof reviews.$inferInsert;
export type TSReview = typeof reviews.$inferSelect;

export type TICoupon = typeof coupons.$inferInsert;
export type TSCoupon = typeof coupons.$inferSelect;

export type TIFlashSale = typeof flashSales.$inferInsert;
export type TSFlashSale = typeof flashSales.$inferSelect;

export type TINotification = typeof notifications.$inferInsert;
export type TSNotification = typeof notifications.$inferSelect;

export type TIAuditLog = typeof auditLogs.$inferInsert;
export type TSAuditLog = typeof auditLogs.$inferSelect;
