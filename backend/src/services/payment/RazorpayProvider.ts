import Razorpay from 'razorpay';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProvider } from './PaymentProvider';

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw ApiError.badRequest('Online payment is not available right now — please choose Cash on Delivery.');
  }
  if (!client) {
    client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return client;
}

// Creates a Razorpay Order (their term for a payment intent, not our Order
// model) and hands back what the frontend needs to open Checkout.js.
// paymentStatus stays PENDING here — it only becomes PAID once the payment
// signature is verified (see verifyRazorpayPayment in order.service.ts) or
// the webhook confirms it, never from this call alone.
export class RazorpayProvider implements PaymentProvider {
  method = 'RAZORPAY' as const;

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const razorpay = getClient();
    const amountInPaise = Math.round(params.amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: params.orderNumber,
    });

    return {
      paymentStatus: 'PENDING',
      providerRef: order.id,
      clientPayload: {
        razorpayOrderId: order.id,
        keyId: env.RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: 'INR',
      },
    };
  }
}
