export interface StripeEventData {
  object: any;
  previous_attributes?: any;
}

export interface StripeEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: StripeEventData;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

export interface StripeCheckoutSession {
  id: string;
  object: 'checkout.session';
  client_reference_id: string;
  customer: string;
  metadata: {
    userId: string;
    tier: string;
  };
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'complete' | 'expired' | 'open';
  subscription: string;
  mode: 'payment' | 'setup' | 'subscription';
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  customer: string;
  status:
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
    }>;
  };
  metadata: {
    userId: string;
    tier: string;
  };
}

export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status:
    | 'succeeded'
    | 'processing'
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'canceled';
  customer: string;
  metadata: {
    userId: string;
    tier?: string;
  };
}
