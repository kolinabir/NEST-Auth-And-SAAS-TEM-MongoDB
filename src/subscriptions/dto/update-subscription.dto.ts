import { PartialType } from '@nestjs/swagger';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @ApiPropertyOptional({ type: Date, description: 'Cancellation date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  canceledAt?: Date;
}
