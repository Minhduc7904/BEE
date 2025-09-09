// src/domain/entities/email-verification-token.entity.ts
export class EmailVerificationToken {
    id: string;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    consumedAt?: Date;

    constructor(data: {
        id: string;
        userId: number;
        tokenHash: string;
        expiresAt: Date;
        createdAt: Date;
        consumedAt?: Date;
    }) {
        this.id = data.id;
        this.userId = data.userId;
        this.tokenHash = data.tokenHash;
        this.expiresAt = data.expiresAt;
        this.createdAt = data.createdAt;
        this.consumedAt = data.consumedAt;
    }

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    isConsumed(): boolean {
        return !!this.consumedAt;
    }

    canBeUsed(): boolean {
        return !this.isExpired() && !this.isConsumed();
    }
}
