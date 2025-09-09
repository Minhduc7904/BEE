// src/domain/repositories/email-verification-token.repository.ts
import { EmailVerificationToken } from '../entities/token/email-verification-token.entity';

export interface IEmailVerificationTokenRepository {
    create(data: {
        userId: number;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<EmailVerificationToken>;

    findByUserId(userId: number): Promise<EmailVerificationToken | null>;

    findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;

    markAsConsumed(id: string): Promise<EmailVerificationToken>;

    deleteByUserId(userId: number): Promise<void>;

    deleteExpiredTokens(): Promise<number>;
}
