// src/infrastructure/repositories/prisma-user-refresh-token.repository.ts
import { PrismaService } from '../../prisma/prisma.service';
import type { IUserRefreshTokenRepository, CreateRefreshTokenData } from '../../domain/repositories/user-refresh-token.repository';
import { UserRefreshToken } from '../../domain/entities/token/user-refresh-token.entity';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper';
import { NumberUtil } from '../../shared/utils/number.util';

export class PrismaUserRefreshTokenRepository implements IUserRefreshTokenRepository {
    constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

    async create(data: CreateRefreshTokenData): Promise<UserRefreshToken> {
        const numericUserId = NumberUtil.ensureValidId(data.userId, 'User ID');
        
        const token = await this.prisma.userRefreshToken.create({
            data: {
                userId: numericUserId,
                familyId: data.familyId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt,
                userAgent: data.userAgent,
                ipAddress: data.ipAddress,
                deviceFingerprint: data.deviceFingerprint,
            },
        });

        return RefreshTokenMapper.toDomainRefreshToken(token)!;
    }

    async findByTokenHash(tokenHash: string): Promise<UserRefreshToken | null> {
        const refreshToken = await this.prisma.userRefreshToken.findUnique({
            where: { tokenHash },
        });

        return RefreshTokenMapper.toDomainRefreshToken(refreshToken);
    }

    async findByUserId(userId: number): Promise<UserRefreshToken[]> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        
        const tokens = await this.prisma.userRefreshToken.findMany({
            where: { userId: numericUserId },
            orderBy: { createdAt: 'desc' },
        });

        return RefreshTokenMapper.toDomainRefreshTokens(tokens);
    }

    async findByFamilyId(familyId: string): Promise<UserRefreshToken[]> {
        const tokens = await this.prisma.userRefreshToken.findMany({
            where: { familyId },
            orderBy: { createdAt: 'desc' },
        });

        return RefreshTokenMapper.toDomainRefreshTokens(tokens);
    }

    async deleteByUserId(userId: number): Promise<void> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        
        await this.prisma.userRefreshToken.deleteMany({
            where: { userId: numericUserId },
        });
    }

    async deleteByTokenHash(tokenHash: string): Promise<boolean> {
        try {
            await this.prisma.userRefreshToken.delete({
                where: { tokenHash },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async deleteByFamilyId(familyId: string): Promise<void> {
        await this.prisma.userRefreshToken.deleteMany({
            where: { familyId },
        });
    }

    async deleteExpiredTokens(): Promise<number> {
        const result = await this.prisma.userRefreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    }

    async revokeToken(tokenHash: string): Promise<boolean> {
        try {
            await this.prisma.userRefreshToken.update({
                where: { tokenHash },
                data: { revokedAt: new Date() },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async revokeAllUserTokens(userId: number): Promise<number> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        
        const result = await this.prisma.userRefreshToken.updateMany({
            where: {
                userId: numericUserId,
                revokedAt: null // Chỉ revoke những token chưa bị revoke
            },
            data: { revokedAt: new Date() },
        });
        return result.count;
    }

    async replaceUserTokens(userId: number, data: CreateRefreshTokenData): Promise<UserRefreshToken> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        
        // Xóa tất cả tokens cũ của user (single device login)
        await this.prisma.userRefreshToken.deleteMany({
            where: { userId: numericUserId },
        });

        // Tạo token mới
        return this.create(data);
    }

    async revokeTokenWithReplacement(tokenHash: string, replacedByTokenId: number): Promise<boolean> {
        const numericReplacedByTokenId = NumberUtil.ensureValidId(replacedByTokenId, 'Replaced By Token ID');
        
        try {
            await this.prisma.userRefreshToken.update({
                where: { tokenHash },
                data: { revokedAt: new Date(), replacedByTokenId: numericReplacedByTokenId },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async revokeTokenFamily(familyId: string): Promise<number> {
        const result = await this.prisma.userRefreshToken.updateMany({
            where: {
                familyId,
                revokedAt: null // Chỉ revoke những token chưa bị revoke
            },
            data: { revokedAt: new Date() },
        });
        return result.count;
    }

    async updateLastUsed(tokenHash: string): Promise<void> {
        await this.prisma.userRefreshToken.update({
            where: { tokenHash },
            data: { lastUsedAt: new Date() },
        });
    }
}
