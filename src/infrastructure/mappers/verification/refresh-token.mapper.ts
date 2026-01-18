import { UserRefreshToken } from '../../../domain/entities'

export class RefreshTokenMapper {
  static toDomainRefreshToken(prismaToken: any): UserRefreshToken | null {
    if (!prismaToken) return null

    return new UserRefreshToken({
      tokenId: prismaToken.tokenId,
      userId: prismaToken.userId,
      familyId: prismaToken.familyId,
      tokenHash: prismaToken.tokenHash,
      expiresAt: prismaToken.expiresAt,
      createdAt: prismaToken.createdAt,
      lastUsedAt: prismaToken.lastUsedAt,
      revokedAt: prismaToken.revokedAt,
      replacedByTokenId: prismaToken.replacedByTokenId,
      userAgent: prismaToken.userAgent,
      ipAddress: prismaToken.ipAddress,
      deviceFingerprint: prismaToken.deviceFingerprint,
    })
  }
  static toDomainRefreshTokens(prismaTokens: any[]): UserRefreshToken[] {
    return prismaTokens.map((token) => this.toDomainRefreshToken(token)).filter(Boolean) as UserRefreshToken[]
  }
}
