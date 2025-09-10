import { UserRefreshToken } from '../../domain/entities/token/user-refresh-token.entity';

export class RefreshTokenMapper {
    static toDomainRefreshToken(prismaToken: any): UserRefreshToken | null {
        if (!prismaToken) return null;

        return new UserRefreshToken(
            prismaToken.tokenId,
            prismaToken.userId,
            prismaToken.familyId,
            prismaToken.tokenHash,
            prismaToken.expiresAt,
            prismaToken.createdAt,
            prismaToken.lastUsedAt,
            prismaToken.revokedAt,
            prismaToken.replacedByTokenId,
            prismaToken.userAgent,
            prismaToken.ipAddress,
            prismaToken.deviceFingerprint
        );
    }
    static toDomainRefreshTokens(prismaTokens: any[]): UserRefreshToken[] {
        return prismaTokens.map(token => this.toDomainRefreshToken(token)).filter(Boolean) as UserRefreshToken[];
    }
}