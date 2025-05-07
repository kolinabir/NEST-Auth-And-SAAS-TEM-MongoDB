import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsObject, IsBoolean, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

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

  // Add this field to fix the error in users.service.ts
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsString()
  emailVerificationToken?: string;
}
