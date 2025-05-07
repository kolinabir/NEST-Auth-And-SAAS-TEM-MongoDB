import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class WebhookEventDto {
  @ApiProperty({
    description: 'Stripe signature header',
    example: 't=1677269692,v1=73a5a5a5b5b5c5c5d5d5e5e5f5f5g5g5,v0=12345678901234567890123456789012'
  })
  @IsNotEmpty()
  @IsString()
  stripeSignature: string;

  @ApiProperty({
    description: 'Raw body of the Stripe webhook event',
    example: '{}'
  })
  @IsNotEmpty()
  @IsObject()
  rawBody: any;
}
