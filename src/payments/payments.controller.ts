import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  Headers,
  HttpCode,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a checkout session for subscription payment',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 200, description: 'Returns checkout session URL' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createCheckoutSession(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req,
  ) {
    // Ensure user can only create payment for themselves unless they're an admin
    if (
      req.user.role !== UserRole.ADMIN &&
      createPaymentDto.userId !== req.user.id
    ) {
      throw new ForbiddenException(
        'You can only create payments for your own account',
      );
    }

    return this.paymentsService.createCheckoutSession(createPaymentDto);
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook received and processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    return this.paymentsService.handleWebhookEvent(signature, request.rawBody);
  }

  @Post('subscriptions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiQuery({
    name: 'atPeriodEnd',
    type: Boolean,
    required: false,
    description: 'Whether to cancel at the end of the billing period',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(
    @Param('id') id: string,
    @Query('atPeriodEnd') atPeriodEnd: boolean = true,
    @Request() req,
  ) {
    // First fetch the subscription directly through the injected SubscriptionsService
    const subscription =
      await this.paymentsService['subscriptionsService'].findById(id);

    // Ensure user can only cancel their own subscription unless they're admin
    if (
      req.user.role !== UserRole.ADMIN &&
      subscription.userId.toString() !== req.user.id
    ) {
      throw new ForbiddenException(
        'You can only cancel your own subscriptions',
      );
    }

    return this.paymentsService.cancelSubscription(id, atPeriodEnd);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a customer portal session for managing subscriptions',
  })
  @ApiQuery({
    name: 'returnUrl',
    type: String,
    required: false,
    description: 'URL to return to after customer portal session',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns customer portal session URL',
  })
  @ApiResponse({ status: 400, description: 'No active subscription found' })
  async createCustomerPortalSession(
    @Request() req,
    @Query('returnUrl') returnUrl?: string,
  ) {
    return this.paymentsService.createCustomerPortalSession(
      req.user.id,
      returnUrl,
    );
  }

  @Post('portal/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a customer portal session for any user (admin only)',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'returnUrl',
    type: String,
    required: false,
    description: 'URL to return to after customer portal session',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns customer portal session URL',
  })
  @ApiResponse({ status: 400, description: 'No active subscription found' })
  async createCustomerPortalSessionAdmin(
    @Param('userId') userId: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    return this.paymentsService.createCustomerPortalSession(userId, returnUrl);
  }

  @Public()
  @Get('config')
  @ApiOperation({
    summary: 'Get Stripe publishable key for frontend integration',
  })
  @ApiResponse({ status: 200, description: 'Returns Stripe publishable key' })
  getPublishableKey() {
    return this.paymentsService.getPublishableKey();
  }
}
