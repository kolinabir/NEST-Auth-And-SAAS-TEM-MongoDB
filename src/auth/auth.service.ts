import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';

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

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    const tokens = await this.generateTokens(user);
    
    // Update lastLogin - now properly typed in UpdateUserDto
    await this.usersService.update(user.id, { lastLogin: new Date() });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      },
      ...tokens,
    };
  }

  async generateTokens(user: UserDocument) {
    const payload = { email: user.email, sub: user.id };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.accessTokenSecret'),
      expiresIn: this.configService.get<string>('app.jwt.accessTokenExpiration'),
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.refreshTokenSecret'),
      expiresIn: this.configService.get<string>('app.jwt.refreshTokenExpiration'),
    });
    
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('app.jwt.refreshTokenSecret'),
      });
      
      // Get user
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
