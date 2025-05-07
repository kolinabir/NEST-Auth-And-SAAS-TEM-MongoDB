import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export class ExportUsersDto {
  @ApiProperty({ enum: ExportFormat, default: ExportFormat.CSV, description: 'Export file format' })
  @IsEnum(ExportFormat)
  format: ExportFormat = ExportFormat.CSV;

  @ApiPropertyOptional({ example: 'users-export', description: 'Custom filename' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ example: 'admin', description: 'Filter by role' })
  @IsOptional()
  @IsString()
  roleFilter?: string;

  @ApiPropertyOptional({ example: 'professional', description: 'Filter by subscription tier' })
  @IsOptional()
  @IsString()
  subscriptionFilter?: string;
}
