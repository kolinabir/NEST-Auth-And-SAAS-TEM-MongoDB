import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  PaymentMethod,
  SubscriptionStatus,
} from '../schemas/subscription.schema';
import { SubscriptionTier } from '../../users/schemas/user.schema';

class PaymentDetailsDto {
  @ApiProperty({
    description: 'Payment method ID or reference',
    example: 'pm_1JFvVn2eZvKYlo2CghT6Dame',
  })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Last 4 digits of card',
    example: '4242',
  })
  @IsOptional()
  @IsString()
  last4?: string;

  @ApiPropertyOptional({ description: 'Card expiry month', example: '12' })
  @IsOptional()
  @IsString()
  expiryMonth?: string;

  @ApiPropertyOptional({ description: 'Card expiry year', example: '2025' })
  @IsOptional()
  @IsString()
  expiryYear?: string;

  @ApiPropertyOptional({ description: 'Card brand', example: 'visa' })
  @IsOptional()
  @IsString()
  brand?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'User ID', example: '60d21b4667d0d8992e610c85' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Subscription tier',
    enum: SubscriptionTier,
    example: SubscriptionTier.PROFESSIONAL,
  })
  @IsEnum(SubscriptionTier)
  @IsNotEmpty()
  tier: SubscriptionTier;

  @ApiProperty({
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
    description: 'Subscription status',
  })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus = SubscriptionStatus.PENDING;

  @ApiProperty({
    type: Date,
    description: 'Start date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    type: Date,
    description: 'End date',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Auto-renewal',
    default: false,
    example: true,
  })
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Payment method',
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    type: PaymentDetailsDto,
    description: 'Payment details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  @ApiPropertyOptional({
    description: 'External ID (e.g., Stripe subscription ID)',
    example: 'sub_1JFvVn2eZvKYlo2CrP4N8R7K',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ description: 'Price', example: 29.99 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Trial days', example: 14 })
  @IsOptional()
  @IsNumber()
  trialDays?: number;

  @ApiPropertyOptional({
    description: 'Features included in subscription',
    example: ['feature1', 'feature2'],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
    additionalProperties: true,
    example: { referralCode: 'ABC123', promoApplied: true },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
