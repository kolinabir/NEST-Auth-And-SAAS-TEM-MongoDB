import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export class UserRoleUpdateDto {
  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN, description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;
}
