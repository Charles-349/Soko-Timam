import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { bankAccounts, sellers, shops, users } from "../Drizzle/schema";

export interface ICreateBankInput {
  sellerId: number; 
  bankName: string;
  accountNumber: string;
  accountName: string;
  branchCode?: string;
}

export const createBankAccountService = async (data: ICreateBankInput) => {
  const inserted = await db
    .insert(bankAccounts)
    .values({
      sellerId: data.sellerId, 
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      branchCode: data.branchCode ?? null,
    })
    .returning();

  return inserted[0];
};

//Get all bank accounts
export const getAllBankAccountsService = async () => {
  return await db.select().from(bankAccounts);
};

//Get bank accounts by seller ID
export const getBankAccountsBySellerIdService = async (sellerId: number) => {
  return await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.sellerId, sellerId));
};

// Get bank account by ID
export const getBankAccountByIdService = async (id: number) => {
  const [bankAccount] = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.id, id));
  return bankAccount;
};

//Update bank account by ID
export interface IUpdateBankAccountInput {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branchCode?: string | null;
}

export const updateBankAccountService = async (
  id: number,
  data: IUpdateBankAccountInput
) => {
  const [updated] = await db
    .update(bankAccounts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(bankAccounts.id, id))
    .returning();
  return updated;
};

//Delete bank account by ID
export const deleteBankAccountService = async (id: number) => {
  const [deleted] = await db
    .delete(bankAccounts)
    .where(eq(bankAccounts.id, id))
    .returning();
  return deleted;
};

export const getBankAccountsBySellerUsernameService = async (username: string) => {
  const results = await db
    .select({
      bankId: bankAccounts.id,
      bankName: bankAccounts.bankName,
      accountNumber: bankAccounts.accountNumber,
      accountName: bankAccounts.accountName,
      branchCode: bankAccounts.branchCode,
      sellerName: sellers.fullname,
      sellerEmail: sellers.email,
      createdAt: bankAccounts.createdAt,
    })
    .from(bankAccounts)
    .innerJoin(sellers, eq(bankAccounts.sellerId, sellers.id))
    .innerJoin(users, eq(sellers.userId, users.id))
    .where(
      sql`${users.firstname} || ' ' || ${users.lastname} ILIKE ${`%${username}%`} 
      OR ${users.email} ILIKE ${`%${username}%`} 
      OR ${sellers.fullname} ILIKE ${`%${username}%`}`
    );

  return results;
};


//Get Bank Details by Shop ID
export const getBankDetailsByShopIdService = async (shopId: number) => {
  //Find shop
  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, shopId),
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  //Find bank account for seller of that shop
  const bankDetails = await db.query.bankAccounts.findMany({
    where: eq(bankAccounts.sellerId, shop.sellerId),
  });

  if (bankDetails.length === 0) {
    throw new Error("No bank details found for this shop");
  }

  return bankDetails;
};
