import { EmailVerificationToken } from '../../../domain/entities'

export class EmailVerificationTokenMapper {
  static toDomainEmailVerificationToken(prismaToken: any): EmailVerificationToken | null {
    if (!prismaToken) return null

    return new EmailVerificationToken({
      id: prismaToken.id,
      userId: prismaToken.userId,
      tokenHash: prismaToken.tokenHash,
      expiresAt: prismaToken.expiresAt,
      createdAt: prismaToken.createdAt,
      consumedAt: prismaToken.consumedAt ?? undefined,
    })
  }
  static toDomainEmailVerificationTokens(prismaTokens: any[]): EmailVerificationToken[] {
    return prismaTokens
      .map((token) => this.toDomainEmailVerificationToken(token))
      .filter(Boolean) as EmailVerificationToken[]
  }
}
