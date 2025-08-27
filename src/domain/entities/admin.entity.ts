// src/domain/entities/admin.entity.ts
import { User } from './user.entity';

export class Admin {
    adminId: number;
    userId: number;
    subject?: string;
    user?: User;

    constructor(
        adminId: number,
        userId: number,
        subject?: string,
        user?: User
    ) {
        this.adminId = adminId;
        this.userId = userId;
        this.subject = subject;
        this.user = user;
    }

    hasSubject(): boolean {
        return !!this.subject;
    }

    getSubjectDisplay(): string {
        return this.subject || 'Chưa xác định';
    }
}
