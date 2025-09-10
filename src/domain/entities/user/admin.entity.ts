// src/domain/entities/admin.entity.ts
import { User } from './user.entity';
import { SubjectEntity } from '../subject/subject.entity';

export class Admin {
    adminId: number;
    userId: number;
    subjectId?: number | null;
    user?: User;
    subject?: SubjectEntity;

    constructor(data: {
        adminId: number;
        userId: number;
        subjectId?: number | null;
        user?: User;
        subject?: SubjectEntity;
    }) {
        this.adminId = data.adminId;
        this.userId = data.userId;
        this.subjectId = data.subjectId;
        this.user = data.user;
        this.subject = data.subject;
    }

    /**
     * Kiểm tra admin có được gán môn học không
     */
    hasSubject(): boolean {
        return !!this.subjectId;
    }

    /**
     * Lấy thông tin môn học
     */
    getSubject(): SubjectEntity | undefined {
        return this.subject;
    }

    /**
     * Lấy tên môn học
     */
    getSubjectName(): string {
        return this.subject?.name || 'Chưa xác định';
    }

    /**
     * Lấy mã môn học
     */
    getSubjectCode(): string {
        return this.subject?.getSubjectCode() || 'N/A';
    }

    /**
     * Hiển thị thông tin môn học đầy đủ
     */
    getSubjectDisplay(): string {
        if (!this.subject) {
            return 'Chưa được gán môn học';
        }
        return this.subject.getFullName();
    }

    /**
     * Kiểm tra admin có phụ trách môn học cụ thể không
     */
    isResponsibleForSubject(subjectId: number): boolean {
        return this.subjectId === subjectId;
    }

    /**
     * Lấy thông tin user
     */
    getUser(): User | undefined {
        return this.user;
    }

    /**
     * Lấy tên đầy đủ của admin
     */
    getFullName(): string {
        if (!this.user) {
            return `Admin #${this.adminId}`;
        }
        return `${this.user.lastName} ${this.user.firstName}`.trim();
    }

    /**
     * Lấy email của admin
     */
    getEmail(): string | undefined {
        return this.user?.email;
    }

    /**
     * Kiểm tra admin có đang active không
     */
    isActive(): boolean {
        return this.user?.isActive ?? false;
    }

    /**
     * Serialize để gửi qua API
     */
    toJSON() {
        return {
            adminId: this.adminId,
            userId: this.userId,
            subjectId: this.subjectId,
            hasSubject: this.hasSubject(),
            subjectName: this.getSubjectName(),
            subjectCode: this.getSubjectCode(),
            subjectDisplay: this.getSubjectDisplay(),
            fullName: this.getFullName(),
            email: this.getEmail(),
            isActive: this.isActive(),
            user: this.user ? {
                userId: this.user.userId,
                username: this.user.username,
                email: this.user.email,
                firstName: this.user.firstName,
                lastName: this.user.lastName,
                isActive: this.user.isActive,
            } : undefined,
            subject: this.subject ? this.subject.toJSON() : undefined,
        };
    }

    /**
     * Tạo entity từ Prisma model data
     */
    static fromPrisma(data: any): Admin {
        return new Admin({
            adminId: data.adminId,
            userId: data.userId,
            subjectId: data.subjectId,
            user: data.user,
            subject: data.subject ? SubjectEntity.fromPrisma(data.subject) : undefined,
        });
    }

    /**
     * Tạo admin cơ bản (chỉ có thông tin chính)
     */
    static createBasic(adminId: number, userId: number, subjectId?: number): Admin {
        return new Admin({
            adminId,
            userId,
            subjectId,
        });
    }

    /**
     * So sánh hai admin entities
     */
    equals(other: Admin): boolean {
        return this.adminId === other.adminId;
    }
}
