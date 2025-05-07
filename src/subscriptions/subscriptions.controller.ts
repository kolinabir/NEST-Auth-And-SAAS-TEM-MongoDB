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
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all subscriptions (admin only)' })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page',
  })
  @ApiResponse({ status: 200, description: 'Returns paginated subscriptions' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.subscriptionsService.findAll(+page, +limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Returns the subscription' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const subscription = await this.subscriptionsService.findById(id);

    // Only admins or the subscription owner can view it
    if (
      req.user.role !== UserRole.ADMIN &&
      subscription.userId.toString() !== req.user.id
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this subscription',
      );
    }

    return subscription;
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a subscription (admin only)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiBody({ type: UpdateSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a subscription (admin only)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async remove(@Param('id') id: string) {
    const result = await this.subscriptionsService.delete(id);
    return { success: result };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(@Param('id') id: string, @Request() req) {
    const subscription = await this.subscriptionsService.findById(id);

    // Only admins or the subscription owner can cancel it
    if (
      req.user.role !== UserRole.ADMIN &&
      subscription.userId.toString() !== req.user.id
    ) {
      throw new ForbiddenException(
        'You do not have permission to cancel this subscription',
      );
    }

    return this.subscriptionsService.cancel(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user subscriptions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserSubscriptions(@Param('userId') userId: string, @Request() req) {
    // Only admins or the user themselves can view their subscriptions
    if (req.user.role !== UserRole.ADMIN && userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to view these subscriptions',
      );
    }

    return this.subscriptionsService.findByUserId(userId);
  }

  @Get('user/:userId/active')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user active subscription' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user active subscription' })
  async getUserActiveSubscription(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    // Only admins or the user themselves can view their active subscription
    if (req.user.role !== UserRole.ADMIN && userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to view this subscription',
      );
    }

    return this.subscriptionsService.findActiveByUserId(userId);
  }

  @Get('user/:userId/details')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user subscription details with limits and features',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns subscription details' })
  async getUserSubscriptionDetails(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    // Only admins or the user themselves can view their subscription details
    if (req.user.role !== UserRole.ADMIN && userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to view these subscription details',
      );
    }

    return this.subscriptionsService.getUserSubscriptionDetails(userId);
  }

  @Public()
  @Get('tiers')
  @ApiOperation({ summary: 'Get all subscription tiers and their features' })
  @ApiResponse({ status: 200, description: 'Returns subscription tiers' })
  async getSubscriptionTiers() {
    return this.subscriptionsService.getSubscriptionTiers();
  }
}
