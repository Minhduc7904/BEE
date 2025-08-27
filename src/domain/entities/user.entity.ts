// src/domain/entities/user.entity.ts
export class User {
    userId: number;
    username: string;
    email?: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: Date;

    constructor(
        userId: number,
        username: string,
        passwordHash: string,
        firstName: string,
        lastName: string,
        isActive: boolean = true,
        email?: string,
        createdAt?: Date
    ) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.isActive = isActive;
        this.createdAt = createdAt || new Date();
    }

    getFullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    isEmailProvided(): boolean {
        return !!this.email;
    }
}
