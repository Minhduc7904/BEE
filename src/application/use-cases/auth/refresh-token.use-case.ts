// src/application/use-cases/refresh-token.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository';
import { JwtTokenService } from '../../../infrastructure/services/jwt.service';
import { TokenHashService } from '../../../infrastructure/services/token-hash.service';
import { RefreshTokenRequestDto, RefreshTokenResponseDto } from '../../dtos/auth/refresh-token.dto';
import {
    UnauthorizedException,
    NotFoundException
} from '../../../shared/exceptions/custom-exceptions';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case cho refresh token với rotation mechanism
 */
@Injectable()
export class RefreshTokenUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
        @Inject('TOKEN_HASH_SERVICE') private readonly tokenHashService: TokenHashService,
    ) { }

    async execute(refreshDto: RefreshTokenRequestDto): Promise<BaseResponseDto<RefreshTokenResponseDto>> {
        return await this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Verify refresh token format và decode
            let decodedToken;
            try {
                decodedToken = this.jwtTokenService.verifyRefreshToken(refreshDto.refreshToken);
            } catch (error) {
                throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
            }

            // 2. Tìm tất cả active refresh tokens của user
            const userId = decodedToken.sub;
            const allUserTokens = await repos.userRefreshTokenRepository.findByUserId(userId);

            // 3. Tìm token match bằng cách verify hash trong tất cả tokens (bao gồm revoked)
            let matchedToken: any = null;
            for (const token of allUserTokens) {
                if (await this.tokenHashService.verifyToken(refreshDto.refreshToken, token.tokenHash)) {
                    matchedToken = token;
                    // console.log(matchedToken);
                    break;
                }
            }

            if (!matchedToken) {
                throw new UnauthorizedException('Refresh token không tồn tại');
            }

            // 5. Kiểm tra token có còn active không
            if (!matchedToken.isActive()) {
                throw new UnauthorizedException('Token đã hết hạn hoặc không còn hiệu lực');
            }

            // 6. Verify user vẫn tồn tại
            const user = await repos.userRepository.findById(matchedToken.userId);
            if (!user) {
                throw new NotFoundException('Người dùng không tồn tại');
            }

            // 7. Tạo JWT tokens mới
            const newTokenPayload = {
                sub: user.userId,
                username: user.username,
                userType: decodedToken.userType,
                adminId: decodedToken.adminId,
                studentId: decodedToken.studentId,
                roles: decodedToken.roles || []
            };

            const newAccessToken = this.jwtTokenService.generateAccessToken(newTokenPayload);
            const newRefreshToken = this.jwtTokenService.generateRefreshToken(newTokenPayload);

            // 8. Tạo refresh token mới với cùng familyId (rotation)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token hết hạn sau 7 ngày

            const newTokenHash = await this.tokenHashService.hashToken(newRefreshToken);

            const refreshTokenData = {
                userId: user.userId,
                familyId: matchedToken.familyId, // Giữ nguyên familyId cho token rotation
                tokenHash: newTokenHash,
                expiresAt,
                userAgent: matchedToken.userAgent,
                ipAddress: matchedToken.ipAddress,
                deviceFingerprint: matchedToken.deviceFingerprint
            };

            const newStoredToken = await repos.userRefreshTokenRepository.create(refreshTokenData);

            // 9. Revoke token cũ với replacement tracking
            await repos.userRefreshTokenRepository.revokeTokenWithReplacement(matchedToken.tokenHash, newStoredToken.tokenId);

            // 10. Update last used cho token cũ
            await repos.userRefreshTokenRepository.updateLastUsed(matchedToken.tokenHash);

            // 11. Tạo response
            const refreshTokenResponse: RefreshTokenResponseDto = {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: 3600 // 1 hour
            };

            return BaseResponseDto.success(
                'Token đã được làm mới thành công',
                refreshTokenResponse
            );
        });
    }
}
