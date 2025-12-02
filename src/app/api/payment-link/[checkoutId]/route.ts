import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/services/transactionService";
import { PaymentLinkResponse, ApiError } from "@/types/api";
import { TransactionStatus } from "@prisma/client";
import { Shift4PaymentLinkCreateRequest } from "@/types/shift4";
import { ZuddlTransaction } from "@/types/zuddl";
import { Shift4Service } from "@/services/shift4Service";
import axios from "axios";
import { getAmountInMinorUnits } from "@/utils/currency";

const transactionService = new TransactionService();
const shift4Service = new Shift4Service();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ checkoutId: string }> }
): Promise<NextResponse<PaymentLinkResponse | ApiError>> {
  try {
    const shift4SecretKey = process.env.SHIFT4_SECRET_KEY!;

    const { checkoutId } = await params;

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Missing checkoutId parameter" },
        { status: 400 }
      );
    }

    let transaction = await transactionService.getTransactionByCheckoutId(
      checkoutId
    );

    if (transaction?.status === TransactionStatus.SUCCESS) {
      return NextResponse.json({
        status: 400,
        error: "Payment already completed for this checkoutId",
      });
    }

    if (transaction?.paymentUrl) {
      return NextResponse.json({
        url: transaction.paymentUrl,
      });
    }

    if (transaction && !transaction.paymentUrl) {
      const shift4Data: Shift4PaymentLinkCreateRequest = {
        collectBillingAddress: true,
        collectShippingAddress: true,
        metadata: {
          checkoutId,
        },
        lineItems: [
          {
            product: {
              amount: transaction.amount,
              currency: transaction.currency,
              name: "Zuddl Transaction",
            },
          },
        ],
      };
      const url = await shift4Service.createShift4PaymentLink(
        shift4Data,
        shift4SecretKey
      );
      await transactionService.updateTransaction(checkoutId, {
        paymentUrl: url,
      });
      return NextResponse.json({
        url,
      });
    }

    const zuddlData = await getZuddlTransactionDetails(checkoutId);
    const unixTimestamp = Math.floor(
      new Date(zuddlData.expiresAt).getTime() / 1000
    );

    const shift4Data: Shift4PaymentLinkCreateRequest = {
      collectBillingAddress: true,
      collectShippingAddress: true,
      restrictions: {
        dates: {
          expiresAt: unixTimestamp,
        },
      },
      metadata: {
        checkoutId,
      },
      lineItems: [
        {
          product: {
            amount: getAmountInMinorUnits(zuddlData.price, zuddlData.currency),
            currency: zuddlData.currency,
            name: "Zuddl Transaction",
          },
        },
      ],
    };
    transaction = await transactionService.createTransaction({
      checkoutId,
      amount: zuddlData.price,
      currency: zuddlData.currency,
      eventId: zuddlData.eventId,
      response: zuddlData,
      status: TransactionStatus.PENDING,
    });

    const url = await shift4Service.createShift4PaymentLink(
      shift4Data,
      shift4SecretKey
    );

    await transactionService.updateTransaction(checkoutId, {
      paymentUrl: url,
    });

    return NextResponse.json({
      url,
    });
  } catch (error) {
    console.error("Error fetching payment link:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function getZuddlTransactionDetails(
  checkoutId: string
): Promise<ZuddlTransaction> {
  try {
    const zuddlApiBaseUrl = process.env.ZUDDL_API_BASE_URL!;
    const zuddlApiKey = process.env.ZUDDL_API_KEY!;
    const response = await axios.get<ZuddlTransaction>(
      `${zuddlApiBaseUrl}/api/custom-payment-gateway/${checkoutId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: zuddlApiKey,
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      }
    );

    return response.data;
  } catch (err: any) {
    const status = err.response?.status;
    const statusText = err.response?.statusText;
    const errorText = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;

    console.error(`Zuddl API call failed: ${status} ${statusText}`);
    console.error(`Zuddl API error response: ${errorText}`);

    throw new Error(`Zuddl API call failed: ${status} - ${errorText}`);
  }
}
