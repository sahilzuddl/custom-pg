import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/services/transactionService";
import { TransactionStatusResponse, ApiError } from "@/types/api";

const transactionService = new TransactionService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ checkoutId: string }> }
): Promise<NextResponse<TransactionStatusResponse | ApiError>> {
  try {
    const { checkoutId } = await params;

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Missing checkoutId parameter" },
        { status: 400 }
      );
    }

    const transaction = await transactionService.getTransactionByCheckoutId(
      checkoutId
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: transaction.status,
    });
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
