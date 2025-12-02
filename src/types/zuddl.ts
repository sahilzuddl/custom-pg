export interface ZuddlWebhookRequestBody {
  webhookEventType?: EZuddlWebhookEventType;
  checkoutId: string;
  amount: number;
  billingDetails: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    street?: string;
    city?: string;
    state?: string;
    postal?: string;
    country?: string;
  };
}

export enum EWebhookEventType {
  CHARGE_SUCCEEDED = "CHARGE_SUCCEEDED",
  CHARGE_FAILED = "CHARGE_FAILED",
}

export enum EZuddlWebhookEventType {
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
}

export interface ZuddlTransaction {
  checkoutId: string;
  eventId: string;
  price: number;
  currency: string;
  expiresAt: string;
}
