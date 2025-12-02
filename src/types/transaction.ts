import { TransactionStatus } from "@prisma/client";
import { ZuddlTransaction } from "./zuddl";

export interface TransactionData {
  checkoutId: string;
  eventId: string;
  paymentUrl?: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  chargeId?: string;
  response?: ZuddlTransaction;
}