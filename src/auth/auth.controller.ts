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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODUiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNjMwMDAwMDAwLCJleHAiOjE2MzAwMDM2MDB9.wNqR9UDA_TPCRCwQJA8mH3r_awGulIglFcITIqG8jzM',
  })
  refreshToken: string;
}

@ApiTags('Authentication')
@ApiCookieAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService, // Add ConfigService
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({
    status: 400,
    description: 'Email already registered or invalid input.',
  })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  // Replace both duplicate verifyEmail methods with a single implementation
  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address using verification token' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email verified successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification token.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid verification token' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  // Support GET method for verification via email links
  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address via link in email' })
  @ApiQuery({ name: 'token', description: 'Email verification token' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email verified successfully' },
      },
    },
  })
  async verifyEmailViaLink(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Replace both duplicate resendVerification methods with a single implementation
  @Public()
  @Post('resend-verification')
  @ApiOperation({
    summary: 'Resend email verification code',
    description: 'Sends a new verification code to the specified email address',
  })
  @ApiBody({
    type: ResendVerificationDto,
    examples: {
      validExample: {
        summary: 'Valid Email Example',
        description: 'A sample request with a valid email address',
        value: { email: 'user@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Verification email has been sent. Please check your inbox.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerificationEmail(
      resendVerificationDto.email,
    );
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

  // Google OAuth
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth authentication flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google authentication',
  })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend after authentication',
  })
  async googleAuthCallback(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      // Generate tokens for the authenticated user
      const tokens = await this.authService.generateTokens(req.user);

      // Set cookies
      this.authService.setTokenCookies(response, tokens);

      // Redirect to frontend
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      response.redirect(`${frontendUrl}/auth/success`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      response.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  // Facebook OAuth
  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Initiate Facebook OAuth authentication flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Facebook authentication',
  })
  async facebookAuth() {
    // Guard redirects to Facebook
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Handle Facebook OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend after authentication',
  })
  async facebookAuthCallback(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const tokens = await this.authService.generateTokens(req.user);
      this.authService.setTokenCookies(response, tokens);
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      response.redirect(`${frontendUrl}/auth/success`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      response.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  // GitHub OAuth
  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth authentication flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub authentication',
  })
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Handle GitHub OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend after authentication',
  })
  async githubAuthCallback(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const tokens = await this.authService.generateTokens(req.user);
      this.authService.setTokenCookies(response, tokens);
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      response.redirect(`${frontendUrl}/auth/success`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      response.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  // Admin auth endpoints
  @ApiTags('Admin Controls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  async listUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.authService.listUsers(+page, +limit);
  }

  @ApiTags('Admin Controls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('users')
  @ApiOperation({ summary: 'Create user as admin' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  async verifyUserEmail(@Param('id') id: string) {
    return this.authService.verifyUserEmail(id);
  }
}
