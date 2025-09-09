// src/shared/guards/google-oauth-admin.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthAdminGuard extends AuthGuard('google-admin') {
    constructor() {
        super({
            accessType: 'offline',
            prompt: 'consent',
        });
    }
}
