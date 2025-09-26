// src/infrastructure/repositories/prisma-password-reset-token.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { IResetPasswordTokenRepository } from '../../domain/repositories'
import { ResetPasswordToken } from '../../domain/entities'
import { ResetPasswordTokenMapper } from '../mappers'

@Injectable()
export class PrismaResetPasswordTokenRepository implements IResetPasswordTokenRepository {
    constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

    async create(data: { userId: number; tokenHash: string; expiresAt: Date }): Promise<ResetPasswordToken> {
        await this.deleteByUserId(data.userId)

        const token = await this.prisma.passwordResetToken.create({
            data: {
                userId: data.userId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt,
            },
        })

        const domainToken = ResetPasswordTokenMapper.toDomainResetPasswordToken(token)
        if (!domainToken) {
            throw new Error('Failed to create password reset token')
        }

        return domainToken
    }

    async findByUserId(userId: number): Promise<ResetPasswordToken | null> {
        const token = await this.prisma.passwordResetToken.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }, // lấy token mới nhất
        })

        return ResetPasswordTokenMapper.toDomainResetPasswordToken(token)
    }

    async findByTokenHash(tokenHash: string): Promise<ResetPasswordToken | null> {
        const token = await this.prisma.passwordResetToken.findFirst({
            where: { tokenHash },
        })

        return ResetPasswordTokenMapper.toDomainResetPasswordToken(token)
    }

    async markAsUsed(id: number): Promise<ResetPasswordToken> {
        const token = await this.prisma.passwordResetToken.update({
            where: { id },
            data: { isUsed: true },
        })

        const domainToken = ResetPasswordTokenMapper.toDomainResetPasswordToken(token)
        if (!domainToken) {
            throw new Error('Failed to mark password reset token as used')
        }

        return domainToken
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId },
        })
    }

    async deleteExpiredTokens(): Promise<number> {
        const result = await this.prisma.passwordResetToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        })

        return result.count
    }
}
