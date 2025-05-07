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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    // Create user
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      authMethods: ['local'], // Fixed: Now this property exists in CreateUserDto
    });

    return newUser;
  }

  async login(loginDto: LoginDto, response: Response) {
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
      },
    };
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

  // Helper method to set secure cookies
  private setTokenCookies(
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
}
