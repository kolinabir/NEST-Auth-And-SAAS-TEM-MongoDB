import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('app.oauth.facebook.clientId'),
      clientSecret: configService.get<string>('app.oauth.facebook.clientSecret'),
      callbackURL: configService.get<string>('app.oauth.facebook.callbackUrl'),
      profileFields: ['id', 'displayName', 'photos', 'email', 'name'],
      scope: ['email'],
    });
    
    this.logger.log('Facebook OAuth strategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    try {
      this.logger.debug(`Processing Facebook OAuth profile: ${profile.id}`);
      
      // Extract profile info safely
      const id = profile.id;
      const email = profile.emails && profile.emails.length > 0 
        ? profile.emails[0].value : undefined;
      const firstName = profile.name?.givenName 
        || (profile.displayName ? profile.displayName.split(' ')[0] : undefined);
      const lastName = profile.name?.familyName 
        || (profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') : undefined);
      const picture = profile.photos && profile.photos.length > 0 
        ? profile.photos[0].value : undefined;
      
      // Create or update user
      const user = await this.authService.validateOAuthUser({
        providerId: id,
        provider: 'facebook',
        email,
        firstName,
        lastName,
        picture,
        accessToken,
        refreshToken,
      });
      
      done(null, user);
    } catch (error) {
      this.logger.error(`Error in Facebook OAuth validation: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}
