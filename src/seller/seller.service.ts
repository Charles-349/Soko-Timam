import  db  from "../Drizzle/db";
import { users, sellers } from "../Drizzle/schema";
import { eq } from "drizzle-orm";

export const registerSeller = async (userId: number, nationalId: string) => {
  //Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error("User not found");

  //Check if already a seller
  const existingSeller = await db.query.sellers.findFirst({
    where: eq(sellers.userId, userId),
  });

  if (existingSeller) throw new Error("Seller account already exists");

  //Combine user info
  const fullname = `${user.firstname} ${user.lastname}`.trim();

  //Create seller
  const [newSeller] = await db
    .insert(sellers)
    .values({
      userId,
      fullname,
      email: user.email ?? "",  
      phone: user.phone ?? "",
      nationalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newSeller;
};

//get seller details by user id
export const getSellerByUserId = async (userId: number) => {
  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.userId, userId),
  });

  return seller;
}

//get all products for a seller by seller id
export const getProductsBySellerId = async (sellerId: number) => {
  const products = await db.query.products.findMany({
    where: eq(sellers.id, sellerId),
  });

  return products;
};                      
