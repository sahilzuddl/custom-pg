import { EZuddlWebhookEventType, ZuddlWebhookRequestBody } from "@/types/zuddl";

export function getBillingDetails(
  data: any
): ZuddlWebhookRequestBody["billingDetails"] {
  const name = data?.billing?.name ?? "";
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(" ");

  const address = data?.billing?.address ?? {};

  return {
    firstName,
    lastName,
    street: address.line1 ?? "",
    city: address.city ?? "",
    postal: address.zip ?? "",
    country: address.country ?? "",
  };
}

export function getZuddlEventType(eventType: string) {
  switch (eventType) {
    case "CHARGE_SUCCEEDED":
      return EZuddlWebhookEventType.PAYMENT_SUCCEEDED;
    case "CHARGE_FAILED":
      return EZuddlWebhookEventType.PAYMENT_FAILED;
    default:
      return undefined;
  }
}