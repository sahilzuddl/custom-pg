import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ZUDDL_API_BASE_URL: z.string().url(),
    ZUDDL_API_KEY: z.string().min(1),
    SHIFT4_SECRET_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]),
    REFUND_SECRET_KEY: z.string().min(1),
    PAYMENT_GATEWAY_ID: z.string().min(1),
  },

  client: {},

  runtimeEnv: {
    ZUDDL_API_BASE_URL: process.env.ZUDDL_API_BASE_URL,
    ZUDDL_API_KEY: process.env.ZUDDL_API_KEY,
    SHIFT4_SECRET_KEY: process.env.SHIFT4_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,
    REFUND_SECRET_KEY: process.env.REFUND_SECRET_KEY,
    PAYMENT_GATEWAY_ID: process.env.PAYMENT_GATEWAY_ID,
  },
});