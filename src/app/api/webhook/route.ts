import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/services/transactionService";
import { ApiError } from "@/types/api";
import { TransactionStatus } from "@prisma/client";
import { WebhookService } from "@/services/webhookService";
import { EWebhookEventType, ZuddlWebhookRequestBody } from "@/types/zuddl";
import { getBillingDetails, getZuddlEventType } from "@/utils/webhook";
import axios from "axios";

const transactionService = new TransactionService();
const webhookService = new WebhookService();

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean } | ApiError>> {
  // Parse the webhook payload
  const event = await request.json();
  console.log("Webhook received:", event);

  if (!event) {
    return NextResponse.json({ error: "Empty webhook event" }, { status: 400 });
  }

  const checkoutId = event?.data?.metadata?.checkoutId;

  if (!checkoutId) {
    return NextResponse.json({ success: true });
  }

  webhookService.createWebhookLog(event);

  if (
    event.type !== EWebhookEventType.CHARGE_SUCCEEDED &&
    event.type !== EWebhookEventType.CHARGE_FAILED
  ) {
    return NextResponse.json({ success: true });
  }

  try {
    const isWebhookSentToZuddl = await sendWebhookToZuddl(event);
    if (!isWebhookSentToZuddl) {
      return NextResponse.json(
        { error: "Failed to send webhook to Zuddl" },
        { status: 500 }
      );
    }
    let transactionStatus: TransactionStatus | null = null;
    if (event.type === EWebhookEventType.CHARGE_SUCCEEDED) {
      transactionStatus = TransactionStatus.SUCCESS;
    } else if (event.type === EWebhookEventType.CHARGE_FAILED) {
      transactionStatus = TransactionStatus.FAILED;
    }

    if (transactionStatus) {
      await transactionService.updateTransaction(checkoutId, {
        status: transactionStatus,
        chargeId: event.data.id,
      });
    }
    return NextResponse.json({ success: true });
  } catch (zuddlError) {
    console.error("Error calling Zuddl API:", zuddlError);
    return NextResponse.json(
      {
        error: "Failed to call Zuddl API",
        message:
          zuddlError instanceof Error ? zuddlError.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function sendWebhookToZuddl(event: any) {
  const body: ZuddlWebhookRequestBody = {
    webhookEventType: getZuddlEventType(event.type),
    checkoutId: event.data.metadata.checkoutId,
    chargeId: event.data.id,
    amount: event.data.amount,
    billingDetails: getBillingDetails(event.data),
  };
  const paymentGatewayId = process.env.PAYMENT_GATEWAY_ID!;
  const zuddlApiBaseUrl = process.env.ZUDDL_API_BASE_URL!;
  const zuddlApiKey = process.env.ZUDDL_API_KEY!;
  try {
    const response = await axios.post(
      `${zuddlApiBaseUrl}/api/custom-payment-gateway/${paymentGatewayId}/webhook`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: zuddlApiKey,
        },
      }
    );
    return response?.status === 200;
  } catch (err: any) {
    console.error("Error sending webhook to Zuddl:", err);
    return false;
  }
}
