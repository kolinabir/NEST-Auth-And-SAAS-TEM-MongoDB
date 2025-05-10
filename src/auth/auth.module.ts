import { Module, DynamicModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import * as passport from 'passport';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({
      session: true,
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwt.accessTokenExpiration'),
        },
      }),
    }),
    EmailsModule, // Add EmailsModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    // Only include OAuth strategies if enabled in config
    {
      provide: GoogleStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const enabled = configService.get<boolean>('app.oauth.google.enabled');
        if (!enabled) {
          return {};
        }
        return new GoogleStrategy(configService, authService);
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: FacebookStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const enabled = configService.get<boolean>(
          'app.oauth.facebook.enabled',
        );
        if (!enabled) {
          return {};
        }
        return new FacebookStrategy(configService, authService);
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: GithubStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const enabled = configService.get<boolean>('app.oauth.github.enabled');
        if (!enabled) {
          return {};
        }
        return new GithubStrategy(configService, authService);
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: 'PassportSerializer',
      useFactory: (authService: AuthService) => {
        passport.serializeUser((user: any, done) => {
          done(null, user.id);
        });

        passport.deserializeUser(async (id: string, done) => {
          try {
            const user = await authService['usersService'].findById(id);
            done(null, user);
          } catch (err) {
            done(err, null);
          }
        });
      },
      inject: [AuthService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
