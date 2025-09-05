// src/infrastructure/services/jwt.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../../config/jwt.config';

export interface JwtPayload {
    sub: number; // userId
    username: string;
    userType: 'admin' | 'student';
    adminId?: number;
    studentId?: number;
    aud: string; // audience
    iss: string; // issuer
    jti?: string; // JWT ID để đảm bảo unique
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtTokenService {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    ) { }

    generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'aud' | 'iss' | 'jti'>): string {
        const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
            ...payload,
            aud: this.jwtConfiguration.audienceApi,
            iss: this.jwtConfiguration.issuer,
            jti: require('crypto').randomUUID(), // Đảm bảo mỗi token là unique
        };

        return this.jwtService.sign(tokenPayload, {
            secret: this.jwtConfiguration.accessSecret,
            expiresIn: this.jwtConfiguration.accessExpiresIn,
            // Không cần issuer và audience ở đây vì đã có trong payload
        });
    }

    generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'aud' | 'iss' | 'jti'>): string {
        const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
            ...payload,
            aud: this.jwtConfiguration.audienceRefresh,
            iss: this.jwtConfiguration.issuer,
            jti: require('crypto').randomUUID(), // Đảm bảo mỗi token là unique
        };

        return this.jwtService.sign(tokenPayload, {
            secret: this.jwtConfiguration.refreshSecret,
            expiresIn: this.jwtConfiguration.refreshExpiresIn,
            // Không cần issuer và audience ở đây vì đã có trong payload
        });
    }

    verifyAccessToken(token: string): JwtPayload {
        return this.jwtService.verify(token, {
            secret: this.jwtConfiguration.accessSecret,
            // Verify sẽ tự động check iss và aud từ payload
        });
    }

    verifyRefreshToken(token: string): JwtPayload {
        return this.jwtService.verify(token, {
            secret: this.jwtConfiguration.refreshSecret,
            // Verify sẽ tự động check iss và aud từ payload
        });
    }

    decodeToken(token: string): JwtPayload | null {
        try {
            return this.jwtService.decode(token) as JwtPayload;
        } catch (error) {
            return null;
        }
    }

    getAccessTokenExpirationTime(): number {
        // Convert time string to seconds
        const expiresIn = this.jwtConfiguration.accessExpiresIn;
        if (expiresIn.endsWith('m')) {
            return parseInt(expiresIn) * 60;
        }
        if (expiresIn.endsWith('h')) {
            return parseInt(expiresIn) * 3600;
        }
        if (expiresIn.endsWith('d')) {
            return parseInt(expiresIn) * 86400;
        }
        return parseInt(expiresIn); // assume seconds
    }
}