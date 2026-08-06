import type { PaymentMethod } from '@prisma/client';
import { CodProvider } from './CodProvider';
import { RazorpayProvider } from './RazorpayProvider';
import type { PaymentProvider } from './PaymentProvider';

const providers: Record<PaymentMethod, PaymentProvider> = {
  COD: new CodProvider(),
  RAZORPAY: new RazorpayProvider(),
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return providers[method];
}

export type { PaymentProvider, InitiatePaymentParams, InitiatePaymentResult } from './PaymentProvider';
