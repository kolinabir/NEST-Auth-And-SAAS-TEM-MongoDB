import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { SubscriptionTier, UserRole } from '../../users/schemas/user.schema';

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export class AdminNotificationDto {
  @ApiProperty({
    example: 'System Maintenance',
    description: 'Notification title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example:
      'The system will be down for maintenance on Sunday from 2-4 AM UTC',
    description: 'Notification content',
  })
  @IsString()
  content: string;

  @ApiProperty({
    enum: NotificationType,
    default: NotificationType.INFO,
    description: 'Notification type',
  })
  @IsEnum(NotificationType)
  type: NotificationType = NotificationType.INFO;

  @ApiPropertyOptional({
    example: ['user123', 'user456'],
    description: 'Specific user IDs to notify',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    description: 'Roles to notify',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({
    enum: SubscriptionTier,
    isArray: true,
    description: 'Subscription tiers to notify',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SubscriptionTier, { each: true })
  subscriptionTiers?: SubscriptionTier[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to send via email',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = false;

  @ApiPropertyOptional({ example: 'low', description: 'Notification priority' })
  @IsOptional()
  @IsString()
  priority?: string;
}
