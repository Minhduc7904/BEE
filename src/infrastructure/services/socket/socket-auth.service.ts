// src/infrastructure/services/socket/socket-auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtTokenService } from '../jwt.service'
import type { AuthenticatedUser } from '../auth.service'

/**
 * SocketAuthService
 * 
 * Service for authenticating Socket.IO connections using JWT tokens.
 * Validates access tokens and extracts user information.
 * 
 * @layer Infrastructure
 * @dependencies JwtTokenService
 */
@Injectable()
export class SocketAuthService {
    constructor(
        private readonly jwtTokenService: JwtTokenService,
    ) { }

    /**
     * Validate JWT token for Socket.IO connection
     * @param token - JWT access token from client
     * @returns Authenticated user information
     * @throws UnauthorizedException if token is invalid
     */
    async validateToken(token: string): Promise<AuthenticatedUser> {
        try {
            // Use existing JWT token service to verify
            const payload = await this.jwtTokenService.verifyAccessToken(token)

            // Return user information in standard format
            return {
                userId: payload.sub,
                username: payload.username,
                userType: payload.userType,
                adminId: payload.adminId,
                studentId: payload.studentId,
                roles: [], // Will be populated by full auth flow if needed
                permissions: [], // Will be populated by full auth flow if needed
            }
        } catch (error) {
            console.error('❌ Socket authentication failed:', error.message)
            throw new UnauthorizedException('Invalid or expired socket token')
        }
    }

    /**
     * Extract token from socket handshake
     * Supports both auth object and authorization header
     */
    extractTokenFromHandshake(handshake: any): string | null {
        // Try auth.token first (recommended)
        if (handshake.auth?.token) {
            return handshake.auth.token
        }

        // Fallback to Authorization header
        const authHeader = handshake.headers?.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7)
        }

        return null
    }
}
