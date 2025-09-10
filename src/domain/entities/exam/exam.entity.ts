// src/domain/entities/exam/exam.entity.ts

export class Exam {
    // Required properties
    examId: number;
    title: string;
    grade: number;
    subject: string;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;

    // Optional properties
    description?: string;
    fileId?: number;
    solutionFileId?: number;

    constructor(
        examId: number,
        title: string,
        grade: number,
        subject: string,
        createdBy: number,
        createdAt: Date,
        updatedAt: Date,
        description?: string,
        fileId?: number,
        solutionFileId?: number
    ) {
        this.examId = examId;
        this.title = title;
        this.grade = grade;
        this.subject = subject;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.description = description;
        this.fileId = fileId;
        this.solutionFileId = solutionFileId;
    }

    // Validation methods
    hasDescription(): boolean {
        return !!this.description;
    }

    hasFile(): boolean {
        return !!this.fileId;
    }

    hasSolutionFile(): boolean {
        return !!this.solutionFileId;
    }

    // Display methods
    getTitleDisplay(): string {
        return this.title || 'Chưa có tiêu đề';
    }

    getDescriptionDisplay(): string {
        return this.description || 'Không có mô tả';
    }

    getSubjectDisplay(): string {
        return this.subject || 'Chưa xác định môn học';
    }

    getGradeDisplay(): string {
        return `Lớp ${this.grade}`;
    }

    // Business logic methods
    isForGrade(grade: number): boolean {
        return this.grade === grade;
    }

    isForSubject(subject: string): boolean {
        return this.subject.toLowerCase() === subject.toLowerCase();
    }

    isCreatedBy(adminId: number): boolean {
        return this.createdBy === adminId;
    }

    isComplete(): boolean {
        return this.hasFile() || this.hasDescription();
    }

    canBeUsedInCompetition(): boolean {
        return this.isComplete() && !!this.title.trim();
    }

    // Date methods
    isCreatedAfter(date: Date): boolean {
        return this.createdAt > date;
    }

    wasUpdatedRecently(daysAgo: number = 7): boolean {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - daysAgo);
        return this.updatedAt > threshold;
    }
}
