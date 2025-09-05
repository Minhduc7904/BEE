// src/application/services/auth.service.ts
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtTokenService } from '../../infrastructure/services/jwt.service';
import type { IRoleRepository } from '../../domain/repositories/role.repository';

export interface AuthenticatedUser {
    userId: number;
    username: string;
    userType: 'admin' | 'student';
    adminId?: number;
    studentId?: number;
    roles: Array<{
        id: number;
        name: string;
        description?: string;
    }>;
}

@Injectable()
export class AuthService {
    constructor(
        @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
        @Inject('ROLE_REPOSITORY') private readonly roleRepository: IRoleRepository,
    ) {}

    async verifyTokenAndGetUser(token: string): Promise<AuthenticatedUser> {
        try {
            // Verify JWT token
            const payload = await this.jwtTokenService.verifyAccessToken(token);
            
            // Get user roles from database
            const userRoles = await this.roleRepository.getUserRoles(payload.sub);
            
            return {
                userId: payload.sub,
                username: payload.username,
                userType: payload.userType,
                adminId: payload.adminId,
                studentId: payload.studentId,
                roles: userRoles.map(ur => ({
                    id: ur.role?.roleId || 0,
                    name: ur.role?.roleName || '',
                    description: ur.role?.description
                }))
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
