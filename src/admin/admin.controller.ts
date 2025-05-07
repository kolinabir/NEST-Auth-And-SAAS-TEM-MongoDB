import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { AdminUserUpdateDto } from './dto/admin-user-update.dto';
import { AdminSubscriptionUpdateDto } from './dto/admin-subscription-update.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { UserRoleUpdateDto } from './dto/user-role-update.dto';
import { UserSearchDto } from './dto/user-search.dto';
import { ExportUsersDto } from './dto/export-users.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AdminNotificationDto } from './dto/admin-notification.dto';
import { OAuthProviderConfigDto } from './dto/oauth-provider-config.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminActivityInterceptor } from './interceptors/admin-activity.interceptor';

@ApiTags('Admin Controls')
@ApiBearerAuth()
@UseGuards(AdminOnlyGuard)
@UseInterceptors(AdminActivityInterceptor)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'List all users with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of users',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '60d21b4667d0d8992e610c85' },
              email: { type: 'string', example: 'user@example.com' },
              firstName: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              role: { type: 'string', example: 'user' },
              blocked: { type: 'boolean', example: false },
              subscriptionTier: { type: 'string', example: 'professional' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 15 },
          },
        },
      },
    },
  })
  async findAllUsers(@Query() searchDto: UserSearchDto) {
    return this.adminService.findAllUsers(searchDto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details with subscription and activity' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUser(@Param('id') id: string) {
    return this.adminService.findUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user details (admin override)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: AdminUserUpdateDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: AdminUserUpdateDto,
  ) {
    return this.adminService.updateUser(id, updateDto);
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Block or unblock a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: BlockUserDto })
  @ApiResponse({ status: 200, description: 'User block status updated' })
  async blockUser(@Param('id') id: string, @Body() blockUserDto: BlockUserDto) {
    return this.adminService.setUserBlockStatus(id, blockUserDto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UserRoleUpdateDto })
  @ApiResponse({ status: 200, description: 'User role updated' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() roleDto: UserRoleUpdateDto,
  ) {
    return this.adminService.updateUserRole(id, roleDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/export')
  @ApiOperation({ summary: 'Export users to CSV or Excel' })
  @ApiBody({ type: ExportUsersDto })
  @ApiResponse({
    status: 200,
    description: 'Returns download URL for the export file',
  })
  async exportUsers(@Body() exportDto: ExportUsersDto) {
    return this.adminService.exportUsers(exportDto);
  }

  @Post('users/import')
  @ApiOperation({ summary: 'Import users from CSV or Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Users imported successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.importUsers(file);
  }

  // Subscription Management
  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Update subscription details (admin override)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiBody({ type: AdminSubscriptionUpdateDto })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateDto: AdminSubscriptionUpdateDto,
  ) {
    return this.adminService.updateSubscription(id, updateDto);
  }

  // Analytics & Dashboard
  @Get('analytics/users')
  @ApiOperation({ summary: 'Get user growth analytics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({ status: 200, description: 'Returns user growth metrics' })
  async getUserAnalytics(@Query() queryDto: AnalyticsQueryDto) {
    return this.adminService.getUserAnalytics(queryDto);
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({ status: 200, description: 'Returns revenue metrics' })
  async getRevenueAnalytics(@Query() queryDto: AnalyticsQueryDto) {
    return this.adminService.getRevenueAnalytics(queryDto);
  }

  @Get('analytics/subscriptions')
  @ApiOperation({ summary: 'Get subscription analytics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({ status: 200, description: 'Returns subscription metrics' })
  async getSubscriptionAnalytics(@Query() queryDto: AnalyticsQueryDto) {
    return this.adminService.getSubscriptionAnalytics(queryDto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard summary' })
  @ApiResponse({ status: 200, description: 'Returns dashboard data' })
  async getDashboard() {
    return this.adminService.getDashboardSummary();
  }

  // User impersonation
  @Post('impersonate/:id')
  @ApiOperation({ summary: 'Impersonate a user (for support purposes)' })
  @ApiParam({ name: 'id', description: 'User ID to impersonate' })
  @ApiResponse({
    status: 200,
    description: 'Returns impersonation token',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  async impersonateUser(@Param('id') id: string) {
    return this.adminService.impersonateUser(id);
  }

  // Notifications
  @Post('notifications')
  @ApiOperation({ summary: 'Send notification to users' })
  @ApiBody({ type: AdminNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notification sent successfully',
  })
  async sendNotification(@Body() notificationDto: AdminNotificationDto) {
    return this.adminService.sendNotification(notificationDto);
  }

  // Activity Logs
  @Get('activity-logs')
  @ApiOperation({ summary: 'Get admin activity logs' })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiResponse({ status: 200, description: 'Returns activity logs' })
  async getActivityLogs(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getActivityLogs(+page, +limit);
  }

  // OAuth Provider Management
  @Get('oauth/providers')
  @ApiOperation({ summary: 'Get all OAuth provider configurations' })
  @ApiResponse({ status: 200, description: 'Returns list of OAuth providers' })
  async getOAuthProviders() {
    return this.adminService.getOAuthProviders();
  }

  @Get('oauth/providers/:provider')
  @ApiOperation({ summary: 'Get specific OAuth provider configuration' })
  @ApiParam({
    name: 'provider',
    description: 'Provider name (google, facebook, github)',
  })
  @ApiResponse({ status: 200, description: 'Returns provider configuration' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getOAuthProvider(@Param('provider') provider: string) {
    return this.adminService.getOAuthProvider(provider);
  }

  @Put('oauth/providers/:provider')
  @ApiOperation({ summary: 'Update OAuth provider configuration' })
  @ApiParam({
    name: 'provider',
    description: 'Provider name (google, facebook, github)',
  })
  @ApiBody({ type: OAuthProviderConfigDto })
  @ApiResponse({ status: 200, description: 'Provider configuration updated' })
  async updateOAuthProvider(
    @Param('provider') provider: string,
    @Body() configDto: OAuthProviderConfigDto,
  ) {
    return this.adminService.updateOAuthProvider(provider, configDto);
  }

  @Get('oauth/stats')
  @ApiOperation({ summary: 'Get OAuth usage statistics' })
  @ApiResponse({ status: 200, description: 'Returns OAuth usage statistics' })
  async getOAuthStats() {
    return this.adminService.getOAuthStats();
  }
}
