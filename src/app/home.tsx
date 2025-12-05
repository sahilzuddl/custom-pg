"use client";
import { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";
import { TransactionStatus } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import axios from "axios";

export enum ScreenState {
  Initial = "initial",
  Loading = "loading",
  Ready = "ready",
  Polling = "polling",
  Error = "error",
  Redirecting = "redirecting",
}


export default function HomeClient() {
  const searchParams = useSearchParams();

  const checkoutId = searchParams.get("checkoutId");
  const encodedReturnUrl = searchParams.get("returnUrl") || "";
  const returnUrl = decodeURIComponent(encodedReturnUrl);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [screen, setScreen] = useState<ScreenState>(ScreenState.Initial);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch payment link when checkoutId is available
  useEffect(() => {
    if (!checkoutId) {
      return;
    }

    const fetchLink = async () => {
      try {
        setScreen(ScreenState.Loading);
        const res = await axios.get(`/api/payment-link/${checkoutId}`);
        const data = res.data;
        if (data.error){
          setError(data.error);
          setScreen(ScreenState.Error);
          return;
        }
        setPaymentLink(data.url);
        setScreen(ScreenState.Ready);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unable to generate payment link.");
        setScreen(ScreenState.Error);
      }
    };

    fetchLink();
  }, [checkoutId]);

  // Polling for transaction status
  useEffect(() => {
    if (!checkoutId || !returnUrl || !paymentLink) {
      return;
    }

    setScreen(ScreenState.Polling);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/transaction-status/${checkoutId}`);
        const data = res.data;

        if (
          [TransactionStatus.SUCCESS, TransactionStatus.FAILED].includes(
            data.status
          )
        ) {
          clearInterval(pollingRef.current!);
          setScreen(ScreenState.Redirecting);
          window.location.href = returnUrl;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000);

    return () => clearInterval(pollingRef.current!);
  }, [checkoutId, returnUrl, paymentLink]);

  switch (screen) {
    case "initial":
      return <div className={styles.loading}>Welcome to Zuddl Custom PG test</div>;

    case "loading":
      return (
        <div className={styles.loading}>Fetching transaction details...</div>
      );

    case "ready":
    case "polling":
      return (
        <>
          {!paymentLink ? (
            <div className={styles.loading}>Loading payment page...</div>
          ) : (
            <div className={styles.page}>
              <iframe
                src={paymentLink}
                title="Payment"
                className={styles.iframe}
              />
            </div>
          )}
        </>
      );

    case "redirecting":
      return <div className={styles.loading}>Redirecting back to Zuddl...</div>;

    case "error":
      return (
        <div className={styles.error}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </div>
      );
    
    default:
      return null;
  }
}
