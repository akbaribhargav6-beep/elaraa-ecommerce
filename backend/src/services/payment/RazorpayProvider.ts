import { ApiError } from '../../utils/apiError';
import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProvider } from './PaymentProvider';

// Phase 3 stub — wired up once RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are
// supplied. The real implementation will create a Razorpay order (amount in
// paise), return { clientPayload: { razorpayOrderId, keyId } } for the
// frontend Checkout.js widget, and a separate webhook/verify endpoint will
// confirm the payment signature before marking the order PAID.
export class RazorpayProvider implements PaymentProvider {
  method = 'RAZORPAY' as const;

  async initiate(_params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    throw ApiError.badRequest('Online payment is not available yet — please choose Cash on Delivery.');
  }
}
