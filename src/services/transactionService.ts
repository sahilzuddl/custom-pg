import { Prisma } from "@prisma/client";
import { prisma } from "./database";
import { TransactionData } from "@/types/transaction";

export class TransactionService {
  async createTransaction(data: TransactionData) {
    const transactionToBeCreated: Prisma.TransactionCreateInput = {
      zuddlCheckoutId: data.checkoutId,
      zuddlEventId: data.eventId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      zuddlResponse: data.response ? JSON.parse(JSON.stringify(data.response)) : undefined,
    };
    return await prisma.transaction.create({ data: transactionToBeCreated });
  }

  async getTransactionByCheckoutId(checkoutId: string) {
    return await prisma.transaction.findUnique({
      where: { zuddlCheckoutId: checkoutId },
    });
  }

  async updateTransaction(checkoutId: string, data: Partial<TransactionData>) {
    return await prisma.transaction.update({
      where: { zuddlCheckoutId: checkoutId },
      data,
    });
  }
}
