// src/domain/entities/exam/exam.entity.ts
import { SubjectEntity } from '../subject/subject.entity';

export class Exam {
    // Required properties
    examId: number;
    title: string;
    grade: number;
    subjectId: number;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;

    // Optional properties
    description?: string;
    fileId?: number;
    solutionFileId?: number;

    // Relations (optional - sẽ được populate khi cần)
    subject?: SubjectEntity;
    admin?: any; // AdminEntity

    constructor(data: {
        examId: number;
        title: string;
        grade: number;
        subjectId: number;
        createdBy: number;
        createdAt: Date;
        updatedAt: Date;
        description?: string;
        fileId?: number;
        solutionFileId?: number;
        subject?: SubjectEntity;
        admin?: any;
    }) {
        this.examId = data.examId;
        this.title = data.title;
        this.grade = data.grade;
        this.subjectId = data.subjectId;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.description = data.description;
        this.fileId = data.fileId;
        this.solutionFileId = data.solutionFileId;
        this.subject = data.subject;
        this.admin = data.admin;
    }

    /**
     * Kiểm tra exam có mô tả không
     */
    hasDescription(): boolean {
        return Boolean(this.description && this.description.trim().length > 0);
    }

    /**
     * Kiểm tra exam có file đề thi không
     */
    hasFile(): boolean {
        return !!this.fileId;
    }

    /**
     * Kiểm tra exam có file đáp án không
     */
    hasSolutionFile(): boolean {
        return !!this.solutionFileId;
    }

    /**
     * Kiểm tra exam có được gán môn học không
     */
    hasSubject(): boolean {
        return !!this.subjectId;
    }

    /**
     * Lấy tiêu đề hiển thị
     */
    getTitleDisplay(): string {
        return this.title || 'Chưa có tiêu đề';
    }

    /**
     * Lấy mô tả hiển thị
     */
    getDescriptionDisplay(): string {
        return this.description || 'Không có mô tả';
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
        return this.subject?.name || 'Chưa xác định môn học';
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
     * Lấy thông tin lớp hiển thị
     */
    getGradeDisplay(): string {
        return `Lớp ${this.grade}`;
    }

    /**
     * Lấy thông tin đầy đủ về exam
     */
    getFullTitle(): string {
        const subjectName = this.getSubjectName();
        return `${this.title} - ${subjectName} - ${this.getGradeDisplay()}`;
    }

    /**
     * Kiểm tra exam có dành cho lớp cụ thể không
     */
    isForGrade(grade: number): boolean {
        return this.grade === grade;
    }

    /**
     * Kiểm tra exam có thuộc môn học cụ thể không (theo ID)
     */
    belongsToSubject(subjectId: number): boolean {
        return this.subjectId === subjectId;
    }

    /**
     * Kiểm tra exam có thuộc môn học cụ thể không (theo tên)
     */
    isForSubjectName(subjectName: string): boolean {
        if (!this.subject) return false;
        return this.subject.name.toLowerCase().includes(subjectName.toLowerCase());
    }

    /**
     * Kiểm tra exam có được tạo bởi admin cụ thể không
     */
    isCreatedBy(adminId: number): boolean {
        return this.createdBy === adminId;
    }

    /**
     * Kiểm tra exam có đầy đủ thông tin cần thiết không
     */
    isComplete(): boolean {
        return this.hasFile() || this.hasDescription();
    }

    /**
     * Kiểm tra exam có thể sử dụng trong thi đấu không
     */
    canBeUsedInCompetition(): boolean {
        return this.isComplete() && 
               Boolean(this.title && this.title.trim()) && 
               this.hasSubject();
    }

    /**
     * Kiểm tra exam có đầy đủ file đề và đáp án không
     */
    hasCompleteFiles(): boolean {
        return this.hasFile() && this.hasSolutionFile();
    }

    /**
     * Lấy độ khó của exam (dựa trên lớp)
     */
    getDifficultyLevel(): string {
        if (this.grade <= 6) return 'Cơ bản';
        if (this.grade <= 9) return 'Trung bình';
        if (this.grade <= 12) return 'Nâng cao';
        return 'Không xác định';
    }

    /**
     * Kiểm tra exam có được tạo sau ngày cụ thể không
     */
    isCreatedAfter(date: Date): boolean {
        return this.createdAt > date;
    }

    /**
     * Kiểm tra exam có được cập nhật gần đây không
     */
    wasUpdatedRecently(daysAgo: number = 7): boolean {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - daysAgo);
        return this.updatedAt > threshold;
    }

    /**
     * Lấy admin tạo exam
     */
    getAdmin(): any | undefined {
        return this.admin;
    }

    /**
     * Serialize để gửi qua API
     */
    toJSON() {
        return {
            examId: this.examId,
            title: this.title,
            grade: this.grade,
            subjectId: this.subjectId,
            createdBy: this.createdBy,
            description: this.description,
            fileId: this.fileId,
            solutionFileId: this.solutionFileId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            // Computed fields
            hasDescription: this.hasDescription(),
            hasFile: this.hasFile(),
            hasSolutionFile: this.hasSolutionFile(),
            hasSubject: this.hasSubject(),
            subjectName: this.getSubjectName(),
            subjectCode: this.getSubjectCode(),
            subjectDisplay: this.getSubjectDisplay(),
            gradeDisplay: this.getGradeDisplay(),
            fullTitle: this.getFullTitle(),
            isComplete: this.isComplete(),
            canBeUsedInCompetition: this.canBeUsedInCompetition(),
            hasCompleteFiles: this.hasCompleteFiles(),
            difficultyLevel: this.getDifficultyLevel(),
            wasUpdatedRecently: this.wasUpdatedRecently(),
            // Relations
            subject: this.subject ? this.subject.toJSON() : undefined,
            admin: this.admin ? {
                adminId: this.admin.adminId,
                userId: this.admin.userId,
                fullName: this.admin.getFullName ? this.admin.getFullName() : undefined,
            } : undefined,
        };
    }

    /**
     * Tạo entity từ Prisma model data
     */
    static fromPrisma(data: any): Exam {
        return new Exam({
            examId: data.examId,
            title: data.title,
            grade: data.grade,
            subjectId: data.subjectId,
            createdBy: data.createdBy,
            description: data.description,
            fileId: data.fileId,
            solutionFileId: data.solutionFileId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            subject: data.subject ? SubjectEntity.fromPrisma(data.subject) : undefined,
            admin: data.admin,
        });
    }

    /**
     * Tạo exam cơ bản
     */
    static createBasic(
        examId: number,
        title: string,
        grade: number,
        subjectId: number,
        createdBy: number
    ): Exam {
        const now = new Date();
        return new Exam({
            examId,
            title,
            grade,
            subjectId,
            createdBy,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * So sánh hai exam entities
     */
    equals(other: Exam): boolean {
        return this.examId === other.examId;
    }
}
