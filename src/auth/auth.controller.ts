import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Res,
  Delete,
  UnauthorizedException,
  Query,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiProperty, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { RolesGuard } from './guards/roles.guard';

class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODUiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNjMwMDAwMDAwLCJleHAiOjE2MzAwMDM2MDB9.wNqR9UDA_TPCRCwQJA8mH3r_awGulIglFcITIqG8jzM',
  })
  refreshToken: string;
}

@ApiTags('Authentication')
@ApiCookieAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Email already registered or invalid input.' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return { message: 'User registered successfully', userId: user.id };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d21b4667d0d8992e610c85' },
            email: { type: 'string', example: 'john.doe@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', example: 'user' },
            subscriptionTier: { type: 'string', example: 'free' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid email or password' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(loginDto, response);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid refresh token' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async refreshToken(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    return this.authService.refreshToken(refreshToken, response);
  }

  @Delete('logout')
  @ApiOperation({ summary: 'Logout and clear cookies' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '60d21b4667d0d8992e610c85' },
        email: { type: 'string', example: 'john.doe@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        role: { type: 'string', example: 'user' },
        subscriptionTier: { type: 'string', example: 'free' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async getProfile(@Request() req) {
    return req.user;
  }

  // Admin auth endpoints
  @ApiTags('Admin Controls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async listUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.authService.listUsers(+page, +limit);
  }
  
  @ApiTags('Admin Controls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('users')
  @ApiOperation({ summary: 'Create user as admin' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async createUser(@Body() registerDto: RegisterDto) {
    const user = await this.authService.createUserAsAdmin(registerDto);
    return { message: 'User created successfully', userId: user.id };
  }
  
  @ApiTags('Admin Controls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
  
  @ApiTags('Admin Controls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('verify-email/:id')
  @ApiOperation({ summary: 'Manually verify user email (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async verifyUserEmail(@Param('id') id: string) {
    return this.authService.verifyUserEmail(id);
  }
}
