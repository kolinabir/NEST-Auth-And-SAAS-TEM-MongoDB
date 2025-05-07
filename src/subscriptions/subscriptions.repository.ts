import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BaseRepository,
  PaginatedResponse,
} from '../common/interfaces/base.interface';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsRepository
  implements BaseRepository<SubscriptionDocument>
{
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async findAll(filter = {}): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find(filter).exec();
  }

  async findById(id: string): Promise<SubscriptionDocument> {
    return this.subscriptionModel.findById(new Types.ObjectId(id)).exec();
  }

  async findOne(filter: any): Promise<SubscriptionDocument> {
    return this.subscriptionModel.findOne(filter).exec();
  }

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionDocument> {
    const data = {
      ...createSubscriptionDto,
      userId: new Types.ObjectId(createSubscriptionDto.userId),
    };
    const newSubscription = new this.subscriptionModel(data);
    return newSubscription.save();
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDocument> {
    return this.subscriptionModel
      .findByIdAndUpdate(new Types.ObjectId(id), updateSubscriptionDto, {
        new: true,
      })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.subscriptionModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
    return result.deletedCount > 0;
  }

  async paginate(
    page = 1,
    limit = 10,
    filter = {},
  ): Promise<PaginatedResponse<SubscriptionDocument>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.subscriptionModel.find(filter).skip(skip).limit(limit).exec(),
      this.subscriptionModel.countDocuments(filter).exec(),
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

  async findByUserId(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gte: new Date() },
      })
      .exec();
  }

  async cancelSubscription(id: string): Promise<SubscriptionDocument> {
    return this.subscriptionModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async findByExternalId(
    externalId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ externalId }).exec();
  }
}
