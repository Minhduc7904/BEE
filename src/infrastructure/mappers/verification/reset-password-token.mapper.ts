import { ResetPasswordToken } from '../../../domain/entities'

export class ResetPasswordTokenMapper {
    static toDomainResetPasswordToken(prismaToken: any): ResetPasswordToken | null {
        if (!prismaToken) return null

        return new ResetPasswordToken({
            id: prismaToken.id,
            userId: prismaToken.userId,
            tokenHash: prismaToken.tokenHash,
            expiresAt: prismaToken.expiresAt,
            createdAt: prismaToken.createdAt,
            isUsed: prismaToken.isUsed,
        })
    }

    static toDomainResetPasswordTokens(prismaTokens: any[]): ResetPasswordToken[] {
        return prismaTokens
            .map((token) => this.toDomainResetPasswordToken(token))
            .filter(Boolean) as ResetPasswordToken[]
    }
}
