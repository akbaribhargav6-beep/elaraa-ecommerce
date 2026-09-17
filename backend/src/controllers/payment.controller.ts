import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { verifyHmacSha256 } from '../utils/verifyHmac';
import { orderService } from '../services/order.service';

interface RazorpayWebhookPayload {
  event: string;
  payload: { payment: { entity: { id: string; order_id: string } } };
}

// Public — Razorpay's own servers call this, not a logged-in user. Verified
// by the webhook signature instead of a session/auth token. Always
// responds 200 once the signature checks out (even if handling the event
// itself throws) so Razorpay doesn't endlessly retry an error that a retry
// can't fix, such as an order that was never found.
export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!env.RAZORPAY_WEBHOOK_SECRET || !rawBody || typeof signature !== 'string') {
    res.status(400).json({ success: false, message: 'Invalid webhook request' });
    return;
  }

  if (!verifyHmacSha256(rawBody, env.RAZORPAY_WEBHOOK_SECRET, signature)) {
    res.status(400).json({ success: false, message: 'Invalid signature' });
    return;
  }

  const { event, payload } = req.body as RazorpayWebhookPayload;
  try {
    await orderService.handleRazorpayWebhookEvent(event, payload);
  } catch (err) {
    console.error('Razorpay webhook handling error:', err);
  }

  res.json({ success: true });
});
