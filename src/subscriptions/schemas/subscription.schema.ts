import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from '../../common/interfaces/base.interface';
import { SubscriptionTier } from '../../users/schemas/user.schema';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  PAST_DUE = 'past_due',
  PENDING = 'pending',
  TRIALING = 'trialing',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CRYPTO = 'crypto',
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: SubscriptionTier })
  tier: SubscriptionTier;

  @Prop({
    required: true,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: false })
  autoRenew: boolean;

  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ type: MongooseSchema.Types.Mixed })
  paymentDetails: Record<string, any>;

  @Prop()
  externalId: string;

  @Prop()
  canceledAt: Date;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  currency: string;

  @Prop({ type: Number })
  trialDays: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionDocument = Subscription & Document & BaseDocument;
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Add indexes for common queries
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ tier: 1 });
SubscriptionSchema.index({ externalId: 1 });
