import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { SubscriptionTier } from '../../users/schemas/user.schema';
import { Type } from 'class-transformer';

export class AdminSubscriptionUpdateDto {
  @ApiPropertyOptional({
    enum: SubscriptionTier,
    description: 'Subscription tier',
  })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;

  @ApiPropertyOptional({
    example: '2023-12-31',
    description: 'Expiration date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    example: 'Manual upgrade by admin',
    description: 'Admin notes',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
