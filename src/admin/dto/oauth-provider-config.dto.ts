import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class OAuthProviderConfigDto {
  @ApiProperty({
    example: 'google',
    description: 'Provider name (google, facebook, github)',
  })
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiProperty({
    example: true,
    description: 'Whether the provider is enabled',
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: 'client-id-here', description: 'OAuth client ID' })
  @IsString()
  clientId: string;

  @ApiProperty({
    example: 'client-secret-here',
    description: 'OAuth client secret',
  })
  @IsString()
  clientSecret: string;

  @ApiProperty({
    example: 'http://localhost:4000/auth/google/callback',
    description: 'OAuth callback URL',
  })
  @IsUrl()
  callbackUrl: string;

  @ApiProperty({
    example: ['profile', 'email'],
    description: 'OAuth scopes to request',
  })
  @IsOptional()
  @IsString({ each: true })
  scopes?: string[];
}
