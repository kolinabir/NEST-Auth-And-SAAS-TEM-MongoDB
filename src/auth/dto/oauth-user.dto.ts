import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthUserDto {
  @ApiProperty({
    description: 'Provider ID (unique identifier from the OAuth provider)',
    example: '12345678901234567890',
  })
  @IsNotEmpty()
  @IsString()
  providerId: string;

  @ApiProperty({
    description: 'OAuth provider name',
    example: 'google',
    enum: ['google', 'facebook', 'github'],
  })
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiPropertyOptional({
    description: 'User email address from the OAuth provider',
    example: 'user@gmail.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User first name from the OAuth provider',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name from the OAuth provider',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL from the OAuth provider',
    example: 'https://lh3.googleusercontent.com/a/profile-picture',
  })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiPropertyOptional({
    description: 'OAuth access token',
    example: 'ya29.a0ARrdaM_example_token',
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({
    description: 'OAuth refresh token',
    example: '1//04example_refresh_token',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
