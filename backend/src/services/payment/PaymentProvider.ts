import type { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface InitiatePaymentParams {
  orderNumber: string;
  amount: number; // rupees
  customerEmail: string;
}

export interface InitiatePaymentResult {
  paymentStatus: PaymentStatus;
  providerRef?: string;
  /** Present for providers that need the client to complete payment (e.g. Razorpay checkout session). */
  clientPayload?: Record<string, unknown>;
}

export interface PaymentProvider {
  method: PaymentMethod;
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
}
