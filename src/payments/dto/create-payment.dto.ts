import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionTier } from '../../users/schemas/user.schema';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'User ID who is making the payment',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Subscription tier to purchase',
    enum: SubscriptionTier,
    example: SubscriptionTier.PROFESSIONAL
  })
  @IsNotEmpty()
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiProperty({
    description: 'Success URL to redirect after payment',
    example: 'https://example.com/success'
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({
    description: 'Cancel URL to redirect if payment is canceled',
    example: 'https://example.com/cancel'
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ApiProperty({
    description: 'Payment method - monthly or yearly',
    enum: ['monthly', 'yearly'],
    example: 'monthly'
  })
  @IsOptional()
  @IsString()
  paymentType?: 'monthly' | 'yearly' = 'monthly';
}
