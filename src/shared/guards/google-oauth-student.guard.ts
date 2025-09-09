// src/shared/guards/google-oauth-student.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthStudentGuard extends AuthGuard('google-student') {
    constructor() {
        super({
            accessType: 'offline',
            prompt: 'consent',
        });
    }
}
