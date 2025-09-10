// src/domain/entities/user.entity.ts
export class User {
    userId: number;
    oldUserId?: number;
    username: string;
    email?: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    isEmailVerified: boolean;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt?: Date;

    constructor(
        userId: number,
        username: string,
        passwordHash: string,
        firstName: string,
        lastName: string,
        isActive: boolean = true,
        email?: string,
        createdAt?: Date,
        isEmailVerified: boolean = false,
        emailVerifiedAt?: Date,
        lastLoginAt?: Date,
        updatedAt?: Date,
        oldUserId?: number
    ) {
        this.userId = userId;
        this.oldUserId = oldUserId;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.isActive = isActive;
        this.isEmailVerified = isEmailVerified;
        this.emailVerifiedAt = emailVerifiedAt;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt;
    }

    getFullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    isEmailProvided(): boolean {
        return !!this.email;
    }

    isEmailVerifiedStatus(): boolean {
        return this.isEmailVerified;
    }

    needsEmailVerification(): boolean {
        return this.isEmailProvided() && !this.isEmailVerified;
    }
}
