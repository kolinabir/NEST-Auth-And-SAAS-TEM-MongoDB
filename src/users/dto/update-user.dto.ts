import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsObject, IsBoolean, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'User preferences',
    type: 'object',
    example: { theme: 'dark', notifications: true },
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User profile information',
    type: 'object',
    example: {
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Software developer',
      location: 'New York',
      company: 'Tech Corp',
      website: 'https://johndoe.com',
      phone: '+1234567890',
    },
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  profile?: {
    avatar?: string;
    bio?: string;
    location?: string;
    company?: string;
    website?: string;
    phone?: string;
  };

  @ApiPropertyOptional({
    description: 'Email verification status',
    type: 'boolean',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Email verification token',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  emailVerificationToken?: string;
}
