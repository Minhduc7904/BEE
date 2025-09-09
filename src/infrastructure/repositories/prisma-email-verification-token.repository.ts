// src/infrastructure/repositories/prisma-email-verification-token.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IEmailVerificationTokenRepository } from '../../domain/repositories/email-verification-token.repository';
import { EmailVerificationToken } from '../../domain/entities/token/email-verification-token.entity';
import { DomainMapper } from '../mappers/domain-mapper';

@Injectable()
export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: {
        userId: number;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<EmailVerificationToken> {
        // Xóa token cũ nếu có
        await this.deleteByUserId(data.userId);

        const token = await this.prisma.emailVerificationToken.create({
            data: {
                userId: data.userId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt,
            },
        });

        const domainToken = DomainMapper.toEmailVerificationTokenDomain(token);
        if (!domainToken) {
            throw new Error('Failed to create email verification token');
        }

        return domainToken;
    }

    async findByUserId(userId: number): Promise<EmailVerificationToken | null> {
        const token = await this.prisma.emailVerificationToken.findUnique({
            where: { userId },
        });

        return token ? DomainMapper.toEmailVerificationTokenDomain(token) : null;
    }

    async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
        const token = await this.prisma.emailVerificationToken.findFirst({
            where: { tokenHash },
        });

        return token ? DomainMapper.toEmailVerificationTokenDomain(token) : null;
    }

    async markAsConsumed(id: string): Promise<EmailVerificationToken> {
        const token = await this.prisma.emailVerificationToken.update({
            where: { id },
            data: { consumedAt: new Date() },
        });

        const domainToken = DomainMapper.toEmailVerificationTokenDomain(token);
        if (!domainToken) {
            throw new Error('Failed to mark email verification token as consumed');
        }

        return domainToken;
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.prisma.emailVerificationToken.deleteMany({
            where: { userId },
        });
    }

    async deleteExpiredTokens(): Promise<number> {
        const result = await this.prisma.emailVerificationToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });

        return result.count;
    }
}
