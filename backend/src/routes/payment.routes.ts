import { Router } from 'express';
import { razorpayWebhook } from '../controllers/payment.controller';

export const paymentRouter = Router();

paymentRouter.post('/razorpay/webhook', razorpayWebhook);
