import db  from "../Drizzle/db"; 
import { bankAccounts } from "../Drizzle/schema";


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
