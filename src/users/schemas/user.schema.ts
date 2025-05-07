import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from '../../common/interfaces/base.interface';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
    },
  },
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({
    type: String,
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subscription' })
  subscriptionId?: MongooseSchema.Types.ObjectId;

  @Prop()
  lastLogin?: Date;

  @Prop({ type: Object, default: {} })
  preferences: Record<string, any>;

  @Prop({ type: Object, default: {} })
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    company?: string;
    website?: string;
    phone?: string;
  };

  @Prop({ default: false })
  blocked: boolean;

  // Authentication methods
  @Prop({ type: [String], default: [] })
  authMethods: string[]; // 'local', 'google', 'facebook', 'github'

  // OAuth provider information
  @Prop({ type: Object, default: {} })
  providerData: Record<string, any>;

  // Add explicit timestamps to satisfy BaseDocument interface
  createdAt: Date;
  updatedAt: Date;

  // Returns the full name of the user (virtual field)
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export type UserDocument = User & Document & BaseDocument;
export const UserSchema = SchemaFactory.createForClass(User);

// Add compound index for efficient querying
UserSchema.index({ email: 1 });
UserSchema.index({ subscriptionTier: 1 });
UserSchema.index({ role: 1 });
