import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
} from 'class-validator';
import { SubscriptionTier, UserRole } from '../schemas/user.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'User password (min 8 characters)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Subscription tier',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  subscriptionTier?: SubscriptionTier;

  @ApiPropertyOptional({
    description: 'Authentication method',
    example: 'local',
    enum: ['local', 'google', 'facebook', 'github'],
  })
  @IsOptional()
  @IsString()
  authMethod?: string;

  @ApiPropertyOptional({
    description: 'Provider data for OAuth authentication',
    type: 'object',
    additionalProperties: true,
    example: {
      provider: 'google',
      providerId: '123456789',
      picture: 'https://example.com/profile.jpg',
      accessToken: 'ya29.a0AfB_byC...',
      profile: {
        name: 'John Doe',
        email: 'john.doe@gmail.com'
      }
    }
  })
  @IsOptional()
  providerData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Authentication methods',
    example: ['local', 'google'],
    isArray: true,
    type: [String],
    enum: ['local', 'google', 'facebook', 'github']
  })
  @IsOptional()
  @IsArray()
  authMethods?: string[];
}
