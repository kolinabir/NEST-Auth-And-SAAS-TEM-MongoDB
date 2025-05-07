import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({ example: true, description: 'Block status' })
  @IsBoolean()
  blocked: boolean;

  @ApiProperty({
    example: 'Violated terms of service',
    description: 'Reason for blocking',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
