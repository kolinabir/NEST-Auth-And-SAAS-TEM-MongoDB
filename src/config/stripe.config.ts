import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  currency: process.env.STRIPE_CURRENCY || 'usd',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  paymentSuccessUrl:
    process.env.STRIPE_PAYMENT_SUCCESS_URL ||
    'http://localhost:3000/subscription/success',
  paymentCancelUrl:
    process.env.STRIPE_PAYMENT_CANCEL_URL ||
    'http://localhost:3000/subscription/cancel',
}));
