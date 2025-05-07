import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SubscriptionTier } from '../users/schemas/user.schema';
import { SubscriptionFeatures } from '../subscriptions/subscriptions-features.config';
import {
  SubscriptionStatus,
  PaymentMethod,
} from '../subscriptions/schemas/subscription.schema';
import {
  StripeEvent,
  StripeCheckoutSession,
  StripeSubscription,
  StripePaymentIntent,
} from './interfaces/stripe-event.interface';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    const stripeKey = this.configService.get<string>('stripe.secretKey');

    if (!stripeKey) {
      this.logger.warn(
        'Stripe secret key not found, payment functionality will be limited',
      );
    }

    try {
      this.stripe = new Stripe(stripeKey || 'dummy_key_for_dev', {
        apiVersion: '2023-10-16',
      });
      this.logger.log('Stripe payment service initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize Stripe: ${error.message}`);
    }
  }

  /**
   * Creates a Stripe checkout session for subscription
   */
  async createCheckoutSession(createPaymentDto: CreatePaymentDto) {
    const { userId, tier, paymentType, successUrl, cancelUrl } =
      createPaymentDto;

    // Verify user exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get subscription details
    const tierDetails = SubscriptionFeatures[tier];
    if (!tierDetails) {
      throw new NotFoundException(`Subscription tier ${tier} not found`);
    }

    // Calculate price based on payment type (monthly/yearly)
    const price =
      paymentType === 'yearly'
        ? tierDetails.price.yearly
        : tierDetails.price.monthly;

    // If tier is FREE, don't create a payment session
    if (tier === SubscriptionTier.FREE) {
      // Create a free subscription
      const subscription = await this.subscriptionsService.create({
        userId,
        tier,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        price: 0,
        currency: this.configService.get<string>('stripe.currency', 'usd'),
        features: tierDetails.features,
      });

      return {
        success: true,
        subscription,
        message: 'Free tier activated',
        isFree: true,
      };
    }

    // Create Stripe checkout session for paid tiers
    try {
      const productName = `${tier} Plan - ${paymentType === 'yearly' ? 'Yearly' : 'Monthly'}`;

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: this.configService.get<string>(
                'stripe.currency',
                'usd',
              ),
              product_data: {
                name: productName,
                description: tierDetails.features.join(', '),
              },
              unit_amount: Math.round(price * 100), // Convert to cents
              recurring: {
                interval: paymentType === 'yearly' ? 'year' : 'month',
              },
            },
            quantity: 1,
          },
        ],
        client_reference_id: userId,
        customer_email: user.email,
        metadata: {
          userId,
          tier,
          paymentType,
        },
        success_url:
          successUrl ||
          this.configService.get<string>('stripe.paymentSuccessUrl'),
        cancel_url:
          cancelUrl ||
          this.configService.get<string>('stripe.paymentCancelUrl'),
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create payment session',
      );
    }
  }

  /**
   * Handles webhook events from Stripe
   */
  async handleWebhookEvent(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );

    let event: StripeEvent;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      ) as StripeEvent;
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException(
        `Webhook signature verification failed: ${error.message}`,
      );
    }

    this.logger.log(`Webhook event received: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as StripeCheckoutSession,
          );
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as StripeSubscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as StripeSubscription,
          );
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as StripePaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as StripePaymentIntent,
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling webhook event: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error handling webhook event: ${error.message}`,
      );
    }

    return { received: true };
  }

  /**
   * Handles completed checkout sessions
   */
  private async handleCheckoutSessionCompleted(session: StripeCheckoutSession) {
    if (session.payment_status !== 'paid') {
      this.logger.log(`Checkout session ${session.id} not yet paid`);
      return;
    }

    const { userId, tier } = session.metadata;

    if (!userId || !tier) {
      this.logger.error(`Missing metadata in checkout session ${session.id}`);
      return;
    }

    // Retrieve the subscription from Stripe to get details
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      session.subscription,
    );

    // Calculate subscription dates
    const startDate = new Date(stripeSubscription.current_period_start * 1000);
    const endDate = new Date(stripeSubscription.current_period_end * 1000);

    // Get price information from the first subscription item
    const price = stripeSubscription.items.data[0]?.price;

    // Create subscription record in database
    const subscription = await this.subscriptionsService.create({
      userId,
      tier: tier as SubscriptionTier,
      status:
        stripeSubscription.status === 'active'
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.PENDING,
      startDate,
      endDate,
      autoRenew: !stripeSubscription.cancel_at_period_end,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      externalId: stripeSubscription.id,
      price: price ? price.unit_amount / 100 : 0, // Convert from cents
      currency: this.configService.get<string>('stripe.currency', 'usd'),
      features: SubscriptionFeatures[tier].features,
    });

    this.logger.log(
      `Subscription created for user ${userId}: ${subscription.id}`,
    );
  }

  /**
   * Handles subscription updates from Stripe
   */
  private async handleSubscriptionUpdated(subscription: StripeSubscription) {
    // Find the subscription in our database by external ID
    const existingSubscription =
      await this.subscriptionsService.findByExternalId(subscription.id);

    if (!existingSubscription) {
      this.logger.error(
        `Subscription ${subscription.id} not found in database`,
      );
      return;
    }

    // Map Stripe status to our status
    let status: SubscriptionStatus;
    switch (subscription.status) {
      case 'active':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'canceled':
        status = SubscriptionStatus.CANCELED;
        break;
      case 'past_due':
        status = SubscriptionStatus.PAST_DUE;
        break;
      case 'unpaid':
        status = SubscriptionStatus.EXPIRED;
        break;
      case 'trialing':
        status = SubscriptionStatus.TRIALING;
        break;
      default:
        status = SubscriptionStatus.PENDING;
    }

    // Update the subscription in our database
    await this.subscriptionsService.update(existingSubscription.id, {
      status,
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      autoRenew: !subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
    });

    this.logger.log(
      `Subscription ${existingSubscription.id} updated to status: ${status}`,
    );
  }

  /**
   * Handles subscription deletions from Stripe
   */
  private async handleSubscriptionDeleted(subscription: StripeSubscription) {
    // Find the subscription in our database by external ID
    const existingSubscription =
      await this.subscriptionsService.findByExternalId(subscription.id);

    if (!existingSubscription) {
      this.logger.error(
        `Subscription ${subscription.id} not found in database`,
      );
      return;
    }

    // Update the subscription status
    await this.subscriptionsService.update(existingSubscription.id, {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
      autoRenew: false,
    });

    this.logger.log(
      `Subscription ${existingSubscription.id} marked as canceled`,
    );
  }

  /**
   * Handles successful payment intents
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: StripePaymentIntent,
  ) {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    // Additional processing could be done here, like recording the payment
  }

  /**
   * Handles failed payment intents
   */
  private async handlePaymentIntentFailed(paymentIntent: StripePaymentIntent) {
    this.logger.error(`Payment intent failed: ${paymentIntent.id}`);
    // You might want to notify the user or take other actions
  }

  /**
   * Cancels a subscription in Stripe
   */
  async cancelSubscription(
    subscriptionId: string,
    atPeriodEnd: boolean = true,
  ) {
    const subscription =
      await this.subscriptionsService.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    if (!subscription.externalId) {
      // This is a local subscription without a Stripe ID (like a free tier)
      await this.subscriptionsService.cancel(subscriptionId);
      return { success: true, canceled: true };
    }

    try {
      // Cancel in Stripe
      await this.stripe.subscriptions.update(subscription.externalId, {
        cancel_at_period_end: atPeriodEnd,
      });

      // Update in our database
      if (!atPeriodEnd) {
        // If canceling immediately, update status now
        await this.subscriptionsService.cancel(subscriptionId);
      } else {
        // Otherwise just mark as not auto-renewing
        await this.subscriptionsService.update(subscriptionId, {
          autoRenew: false,
        });
      }

      return {
        success: true,
        canceled: !atPeriodEnd, // If canceled at period end, it's not immediately canceled
        canceledAtPeriodEnd: atPeriodEnd,
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to cancel subscription: ${error.message}`,
      );
    }
  }

  /**
   * Generates a customer portal session for subscription management
   */
  async createCustomerPortalSession(userId: string, returnUrl?: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Find active subscription
    const subscription =
      await this.subscriptionsService.findActiveByUserId(userId);

    if (!subscription || !subscription.externalId) {
      throw new BadRequestException(
        'No active subscription found for this user',
      );
    }

    // Get Stripe subscription to find customer ID
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscription.externalId,
    );

    if (!stripeSubscription.customer) {
      throw new BadRequestException('No customer found for this subscription');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: stripeSubscription.customer as string,
        return_url:
          returnUrl ||
          this.configService.get<string>('stripe.paymentSuccessUrl'),
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create customer portal session: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create customer portal session',
      );
    }
  }

  /**
   * Gets the Stripe publishable key for frontend integrations
   */
  getPublishableKey() {
    return {
      publishableKey: this.configService.get<string>('stripe.publishableKey'),
    };
  }
}
