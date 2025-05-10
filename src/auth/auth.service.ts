import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { Response } from 'express';
import { OAuthUserDto } from './dto/oauth-user.dto';
import { EmailsService } from '../emails/emails.service';
// Add the correct import for crypto
import * as cryptoModule from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailsService: EmailsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    // If no password (could be OAuth user), or password doesn't match
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      return null;
    }

    // Check if email is verified (except for OAuth users and admin)
    if (
      !user.emailVerified &&
      user.authMethods.includes('local') &&
      user.role !== UserRole.ADMIN
    ) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    return user;
  }

  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with verification token
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      authMethods: ['local'],
    });

    // Send verification email
    await this.emailsService.sendVerificationEmail(
      email,
      newUser.emailVerificationToken,
      newUser.firstName,
    );

    return newUser;
  }

  async login(loginDto: LoginDto, response: Response) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const tokens = await this.generateTokens(user);

      // Update lastLogin - now properly typed in UpdateUserDto
      await this.usersService.update(user.id, { lastLogin: new Date() });

      // Set cookies
      this.setTokenCookies(response, tokens);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async generateTokens(user: UserDocument) {
    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.accessTokenSecret'),
      expiresIn: this.configService.get<string>(
        'app.jwt.accessTokenExpiration',
      ),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.refreshTokenSecret'),
      expiresIn: this.configService.get<string>(
        'app.jwt.refreshTokenExpiration',
      ),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string, response: Response) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshTokenSecret'),
      });

      // Get user
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Set cookies
      this.setTokenCookies(response, tokens);

      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Make setTokenCookies public instead of private
  public setTokenCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProduction = this.configService.get('app.nodeEnv') === 'production';

    // Set access token cookie
    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
    });

    // Set refresh token cookie
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  }

  // Method to clear auth cookies on logout
  logout(response: Response) {
    const isProduction = this.configService.get('app.nodeEnv') === 'production';

    response.cookie('access_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 0,
    });

    response.cookie('refresh_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 0,
    });

    return { success: true };
  }

  async createUserAsAdmin(registerDto: RegisterDto): Promise<UserDocument> {
    const { email, password, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with admin-specified role and verification status
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      authMethods: ['local'],
      // Fixed the issue by using proper typing for the update
    });

    // Update user with admin-specific fields after creation
    return this.usersService.update(newUser.id, {
      emailVerified: registerDto.skipEmailVerification || false,
      role: role || UserRole.USER,
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const result = await this.usersService.delete(id);
    return { success: result };
  }

  async verifyUserEmail(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.usersService.markEmailAsVerified(id);
    // Explicitly define return type to include message property
    return { success: true, message: 'Email verified successfully' };
  }

  async listUsers(page = 1, limit = 10): Promise<any> {
    return this.usersService.paginate(page, limit);
  }

  async validateOAuthUser(oauthUser: OAuthUserDto): Promise<any> {
    const {
      providerId,
      provider,
      email,
      firstName,
      lastName,
      picture,
      accessToken,
    } = oauthUser;

    // First try to find user by provider ID if we have a findByProviderId method
    let user = null;
    try {
      // Check if the findByProviderId method exists
      if (typeof this.usersService['findByProviderId'] === 'function') {
        user = await this.usersService['findByProviderId'](
          provider,
          providerId,
        );
      }
    } catch (error) {
      // Method may not exist yet, continue with email lookup
    }

    // If not found by provider ID, try to find by email
    if (!user && email) {
      user = await this.usersService.findByEmail(email);
    }

    if (user) {
      // Update existing user with OAuth info
      const providerData = user.providerData || {};
      const authMethods = user.authMethods || [];

      user = await this.usersService.update(user.id, {
        authMethods: [...new Set([...authMethods, provider])],
        providerData: {
          ...providerData,
          [provider]: {
            id: providerId,
            accessToken,
            profile: { firstName, lastName, picture },
          },
        },
        // If user was created via another method but email wasn't verified yet,
        // auto-verify when they log in with OAuth
        emailVerified: true,
      });
    } else {
      // Create new user
      const newUser = await this.usersService.create({
        firstName: firstName || 'User',
        lastName:
          lastName || provider.charAt(0).toUpperCase() + provider.slice(1),
        email: email || `${providerId}@${provider}.user`,
        authMethods: [provider],
        providerData: {
          [provider]: {
            id: providerId,
            accessToken,
            profile: { firstName, lastName, picture },
          },
        },
      });

      // Update user with additional fields after creation
      user = await this.usersService.update(newUser.id, {
        emailVerified: !!email, // Auto-verify if email provided by OAuth
        profile: {
          avatar: picture,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    };
  }

  async verifyEmail(
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email already verified' };
    }

    await this.usersService.markEmailAsVerified(user.id);

    // Send verification success email
    await this.emailsService.sendVerificationSuccessEmail(
      user.email,
      user.firstName,
    );

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal user existence, just return success
      return {
        success: true,
        message:
          'If your email exists in our system, a verification link has been sent',
      };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email already verified' };
    }

    // Generate a new verification token with the correct crypto import
    const emailVerificationToken = cryptoModule
      .randomBytes(3)
      .toString('hex')
      .toUpperCase();

    // Update user with new token
    await this.usersService.update(user.id, { emailVerificationToken });

    // Send verification email
    await this.emailsService.sendVerificationEmail(
      email,
      emailVerificationToken,
      user.firstName,
    );

    return {
      success: true,
      message: 'Verification email has been sent. Please check your inbox.',
    };
  }
}
