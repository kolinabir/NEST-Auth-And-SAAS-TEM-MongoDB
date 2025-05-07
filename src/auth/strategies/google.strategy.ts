import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('app.oauth.google.clientId'),
      clientSecret: configService.get<string>('app.oauth.google.clientSecret'),
      callbackURL: configService.get<string>('app.oauth.google.callbackUrl'),
      scope: ['email', 'profile'],
    });

    this.logger.log('Google OAuth strategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      this.logger.debug(`Processing Google OAuth profile: ${profile.id}`);

      // Extract profile info safely
      const id = profile.id;
      const email =
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : undefined;
      const firstName =
        profile.name?.givenName ||
        (profile.displayName ? profile.displayName.split(' ')[0] : undefined);
      const lastName =
        profile.name?.familyName ||
        (profile.displayName
          ? profile.displayName.split(' ').slice(1).join(' ')
          : undefined);
      const picture =
        profile.photos && profile.photos.length > 0
          ? profile.photos[0].value
          : undefined;

      // Create or update user
      const user = await this.authService.validateOAuthUser({
        providerId: id,
        provider: 'google',
        email,
        firstName,
        lastName,
        picture,
        accessToken,
        refreshToken,
      });

      done(null, user);
    } catch (error) {
      this.logger.error(
        `Error in Google OAuth validation: ${error.message}`,
        error.stack,
      );
      done(error, false);
    }
  }
}
