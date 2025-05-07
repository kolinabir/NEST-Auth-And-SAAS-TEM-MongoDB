import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import { UsersService } from '../users/users.service';
import { PaginatedResponse } from '../common/interfaces/base.interface';
import { SubscriptionTier } from '../users/schemas/user.schema';
import { SubscriptionFeatures } from './subscriptions-features.config';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly usersService: UsersService,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<SubscriptionDocument>> {
    return this.subscriptionsRepository.paginate(page, limit);
  }

  async findById(id: string): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionsRepository.findById(id);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionDocument> {
    // Check if user exists
    const user = await this.usersService.findById(createSubscriptionDto.userId);
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createSubscriptionDto.userId} not found`,
      );
    }

    // Create subscription and get features for the tier
    const tier = createSubscriptionDto.tier;
    const subscriptionFeatures = SubscriptionFeatures[tier]?.features || [];

    const subscription = await this.subscriptionsRepository.create({
      ...createSubscriptionDto,
      features: subscriptionFeatures,
    });

    // Update user's subscription tier
    await this.usersService.update(user.id, { subscriptionTier: tier });

    return subscription;
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDocument> {
    // Ensure subscription exists
    const subscription = await this.findById(id);

    // Handle tier change
    if (
      updateSubscriptionDto.tier &&
      updateSubscriptionDto.tier !== subscription.tier
    ) {
      // Get features for new tier
      const tier = updateSubscriptionDto.tier;
      updateSubscriptionDto.features =
        SubscriptionFeatures[tier]?.features || [];

      // Update user's subscription tier
      await this.usersService.update(subscription.userId.toString(), {
        subscriptionTier: tier,
      });
    }

    return this.subscriptionsRepository.update(id, updateSubscriptionDto);
  }

  async cancel(id: string): Promise<SubscriptionDocument> {
    const subscription = await this.findById(id);
    return this.subscriptionsRepository.cancelSubscription(id);
  }

  async delete(id: string): Promise<boolean> {
    // Ensure subscription exists
    await this.findById(id);
    return this.subscriptionsRepository.delete(id);
  }

  async findByUserId(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionsRepository.findByUserId(userId);
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionsRepository.findActiveByUserId(userId);
  }

  async getUserSubscriptionDetails(userId: string): Promise<any> {
    // Get user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get active subscription
    const activeSubscription = await this.findActiveByUserId(userId);

    // Get subscription tier details
    const tier = user.subscriptionTier || SubscriptionTier.FREE;
    const tierDetails =
      SubscriptionFeatures[tier] || SubscriptionFeatures[SubscriptionTier.FREE];

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      subscription: activeSubscription,
      tier,
      limits: {
        projects: tierDetails.projects,
        storage: tierDetails.storage,
        apiCalls: tierDetails.apiCalls,
        teamMembers: tierDetails.teamMembers,
      },
      features: tierDetails.features,
      price: tierDetails.price,
      support: tierDetails.support,
    };
  }

  async getSubscriptionTiers() {
    return {
      tiers: Object.values(SubscriptionTier),
      details: SubscriptionFeatures,
    };
  }
}
