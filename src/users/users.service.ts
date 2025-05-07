import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schemas/user.schema';
import { PaginatedResponse } from '../common/interfaces/base.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(): Promise<UserDocument[]> {
    return this.usersRepository.findAll();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.usersRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }
    return this.usersRepository.create(createUserDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findById(id);
    
    // If trying to update email, check if the new email is already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`User with email ${updateUserDto.email} already exists`);
      }
    }
    
    return this.usersRepository.update(id, updateUserDto);
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id); // Verify user exists
    return this.usersRepository.delete(id);
  }

  async paginate(page = 1, limit = 10): Promise<PaginatedResponse<UserDocument>> {
    return this.usersRepository.paginate(page, limit);
  }

  async updateSubscription(userId: string, subscriptionId: string, tier: string): Promise<UserDocument> {
    await this.findById(userId); // Verify user exists
    return this.usersRepository.updateSubscription(userId, subscriptionId, tier);
  }

  async findBySubscriptionTier(tier: string, page = 1, limit = 10): Promise<PaginatedResponse<UserDocument>> {
    return this.usersRepository.findBySubscriptionTier(tier, page, limit);
  }

  async markEmailAsVerified(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    
    // Fixed: Now using properties that exist in UpdateUserDto
    return this.usersRepository.update(id, {
      emailVerified: true,
      emailVerificationToken: null, // This will be converted to undefined for MongoDB
    });
  }
}
