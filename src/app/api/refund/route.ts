import { Shift4Service } from "@/services/shift4Service";
import { TransactionService } from "@/services/transactionService";
import { ApiError } from "@/types/api";
import { getAmountInMinorUnits } from "@/utils/currency";
import { NextRequest, NextResponse } from "next/server";

const transactionService = new TransactionService();
const shift4Service = new Shift4Service();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; refundId: string } | ApiError>> {

  // validate auth header
  const headers = new Headers(request.headers);
  const refundSecretKey = process.env.REFUND_SECRET_KEY!;

  const authHeader = headers.get("Authorization");

  const base64Secret = authHeader?.split("Bearer ")[1];
  if (!base64Secret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  const decodedSecret = Buffer.from(base64Secret, 'base64').toString('utf-8');
  if (decodedSecret !== refundSecretKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // parse request body
  const body = await request.json();
  const refundAmount = body?.amount;

  if (!refundAmount || refundAmount <= 0) {
    return NextResponse.json(
      { error: "Invalid refund amount" },
      { status: 400 }
    );
  }

  const checkoutId = body.checkoutId;
  if (!checkoutId) {
    return NextResponse.json(
      { error: "Missing checkoutId in request body" },
      { status: 400 }
    );
  }

  const shift4SecretKey = process.env.SHIFT4_SECRET_KEY!;

  const transaction = await transactionService.getTransactionByCheckoutId(checkoutId);
  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found for the provided checkoutId" },
      { status: 404 }
    );
  }

  if (transaction.amount < refundAmount) {
    return NextResponse.json(
      { error: "Refund amount exceeds original transaction amount" },
      { status: 400 }
    );
  }
  
  if (!transaction.chargeId) {
    return NextResponse.json(
      { error: "Transaction does not have a valid chargeId for refund" },
      { status: 400 }
    );
  }

  // create shift4 refund object
  const shift4RefundObj = {
    chargeId: transaction.chargeId,
    amount: getAmountInMinorUnits(refundAmount, transaction.currency),
  };

  const refundId = await shift4Service.initiateRefund(shift4RefundObj, shift4SecretKey);
  return NextResponse.json({ success: true, refundId });
}
