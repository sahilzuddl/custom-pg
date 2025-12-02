import { Shift4PaymentLinkCreateRequest } from "@/types/shift4";
import axios from "axios";

export class Shift4Service {
  async createShift4PaymentLink(
    shift4Data: Shift4PaymentLinkCreateRequest,
    shift4SecretKey: string
  ): Promise<string> {
    const authHeader = `Basic ${Buffer.from(`${shift4SecretKey}:`).toString(
      "base64"
    )}`;

    try {
      const response = await axios.post(
        "https://api.shift4.com/payment-links",
        shift4Data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );

      return response.data.url;
    } catch (err: any) {
      const status = err.response?.status;
      const errorText = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;

      throw new Error(`Shift4 API call failed: ${status} - ${errorText}`);
    }
  }
  async initiateRefund(
    shift4RefundObj: { chargeId: string; amount: number },
    shift4SecretKey: string
  ): Promise<string> {
    const authHeader = `Basic ${Buffer.from(`${shift4SecretKey}:`).toString(
      "base64"
    )}`;

    try {
      const response = await axios.post(
        "https://api.shift4.com/refunds",
        shift4RefundObj,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );

      return response.data.id;
    } catch (err: any) {
      console.error("Error initiating refund with Shift4:", err); // Debugging log
      const status = err.response?.status;
      const errorText = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;

      throw new Error(`Shift4 refund API call failed: ${status} - ${errorText}`);
    }
  }
}
