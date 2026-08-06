import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProvider } from './PaymentProvider';

// Cash on Delivery — nothing to charge now. Payment is collected physically
// at delivery and marked PAID by an admin at that point (Phase 2).
export class CodProvider implements PaymentProvider {
  method = 'COD' as const;

  async initiate(_params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    return { paymentStatus: 'PENDING' };
  }
}
