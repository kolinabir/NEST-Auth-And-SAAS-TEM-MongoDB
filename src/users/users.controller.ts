import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schemas/user.schema';
import { PaginatedResponse } from '../common/interfaces/base.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDocument> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<UserDocument>> {
    return this.usersService.paginate(+page, +limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDocument> {
    return this.usersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.usersService.delete(id);
    return { success: result };
  }

  @Get('subscription/:tier')
  async findBySubscriptionTier(
    @Param('tier') tier: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponse<UserDocument>> {
    return this.usersService.findBySubscriptionTier(tier, +page, +limit);
  }
}
