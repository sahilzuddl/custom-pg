export interface PaymentLinkResponse {
  url: string;
}

export interface TransactionStatusResponse {
  status: string;
}

export interface ApiError {
  error: string;
  message?: string;
}
