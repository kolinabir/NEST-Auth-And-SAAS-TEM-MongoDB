import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum AnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class AnalyticsQueryDto {
  @ApiProperty({ enum: AnalyticsPeriod, default: AnalyticsPeriod.MONTH, description: 'Time period for analytics' })
  @IsEnum(AnalyticsPeriod)
  period: AnalyticsPeriod = AnalyticsPeriod.MONTH;

  @ApiPropertyOptional({ example: '2023-01-01', description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2023-12-31', description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
