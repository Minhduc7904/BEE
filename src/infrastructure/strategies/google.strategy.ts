// src/infrastructure/strategies/google.strategy.ts
import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { ConfigType } from '@nestjs/config';
import googleOAuthConfig from '../../config/google-oauth.config';
import { GoogleUserProfileDto } from '../../application/dtos/auth/google-auth.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        @Inject(googleOAuthConfig.KEY)
        private readonly googleConfig: ConfigType<typeof googleOAuthConfig>,
    ) {
        // Debug log để kiểm tra config
        console.log('Google OAuth Config:', {
            clientID: googleConfig.clientID ? 'PRESENT' : 'MISSING',
            clientSecret: googleConfig.clientSecret ? 'PRESENT' : 'MISSING',
            callbackURL: googleConfig.callbackURL
        });

        if (!googleConfig.clientID || !googleConfig.clientSecret) {
            throw new Error('Google OAuth credentials are missing. Please check your environment variables.');
        }

        super({
            clientID: googleConfig.clientID,
            clientSecret: googleConfig.clientSecret,
            callbackURL: googleConfig.callbackURL,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;
        
        const user: GoogleUserProfileDto = {
            googleId: id,
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0]?.value,
            verified: emails[0].verified,
        };

        done(null, user);
    }
}
