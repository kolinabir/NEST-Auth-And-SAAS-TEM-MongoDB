import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseRepository, PaginatedResponse } from '../common/interfaces/base.interface';

@Injectable()
export class UsersRepository implements BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(filter = {}): Promise<UserDocument[]> {
    return this.userModel.find(filter).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    return this.userModel.findById(new Types.ObjectId(id)).exec();
  }

  async findOne(filter: any): Promise<UserDocument> {
    return this.userModel.findOne(filter).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(new Types.ObjectId(id), updateUserDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    return result.deletedCount > 0;
  }

  async paginate(page = 1, limit = 10, filter = {}): Promise<PaginatedResponse<UserDocument>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async updateSubscription(userId: string, subscriptionId: string, tier: string): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(
        new Types.ObjectId(userId),
        {
          subscriptionId: new Types.ObjectId(subscriptionId),
          subscriptionTier: tier,
        },
        { new: true },
      )
      .exec();
  }

  async findBySubscriptionTier(tier: string, page = 1, limit = 10): Promise<PaginatedResponse<UserDocument>> {
    return this.paginate(page, limit, { subscriptionTier: tier });
  }
}
