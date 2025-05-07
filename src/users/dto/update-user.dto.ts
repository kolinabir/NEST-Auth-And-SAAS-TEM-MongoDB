import { PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsObject,
  IsBoolean,
  IsString,
  IsDate,
  IsEmail,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'User preferences',
    example: { theme: 'dark', notifications: true },
    additionalProperties: true,
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User profile information',
    example: {
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Software developer',
      location: 'New York',
      company: 'Tech Corp',
      website: 'https://johndoe.com',
      phone: '+1234567890',
    },
    additionalProperties: true,
    type: 'object',
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

  @ApiPropertyOptional({
    description: 'Last login date',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  lastLogin?: Date;

  @ApiPropertyOptional({ 
    description: 'User blocked status',
    example: false,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;
}
