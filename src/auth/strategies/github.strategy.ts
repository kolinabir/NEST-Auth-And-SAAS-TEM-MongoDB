import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('app.oauth.github.clientId'),
      clientSecret: configService.get<string>('app.oauth.github.clientSecret'),
      callbackURL: configService.get<string>('app.oauth.github.callbackUrl'),
      scope: ['user:email'],
    });
    
    this.logger.log('GitHub OAuth strategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    try {
      this.logger.debug(`Processing GitHub OAuth profile: ${profile.id}`);
      
      // Extract profile info safely
      const id = profile.id;
      const email = profile.emails && profile.emails.length > 0 
        ? profile.emails[0].value : undefined;
      
      // GitHub profile might not have name separated into first/last
      const displayName = profile.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts.length > 0 ? nameParts[0] : 'GitHub';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
      
      const picture = profile.photos && profile.photos.length > 0 
        ? profile.photos[0].value : undefined;
      
      // Create or update user
      const user = await this.authService.validateOAuthUser({
        providerId: id,
        provider: 'github',
        email,
        firstName,
        lastName,
        picture,
        accessToken,
        refreshToken,
      });
      
      done(null, user);
    } catch (error) {
      this.logger.error(`Error in GitHub OAuth validation: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}
