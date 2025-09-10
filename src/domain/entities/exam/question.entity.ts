// src/domain/entities/exam/question.entity.ts

import { QuestionType } from '../../../shared/enums/question-type.enum';
import { Difficulty } from '../../../shared/enums/difficulty.enum';

export class Question {
    // Required properties
    questionId: number;
    content: string;
    type: QuestionType;
    difficulty: Difficulty;
    grade: number;
    createdAt: Date;
    updatedAt: Date;

    // Optional properties
    imageId?: number;
    correctAnswer?: string;
    solution?: string;
    chapter?: string;
    solutionYoutubeUrl?: string;
    solutionImageId?: number;
    subject?: string;
    createdBy?: number;

    constructor(
        questionId: number,
        content: string,
        type: QuestionType,
        difficulty: Difficulty,
        grade: number,
        createdAt: Date,
        updatedAt: Date,
        imageId?: number,
        correctAnswer?: string,
        solution?: string,
        chapter?: string,
        solutionYoutubeUrl?: string,
        solutionImageId?: number,
        subject?: string,
        createdBy?: number
    ) {
        this.questionId = questionId;
        this.content = content;
        this.type = type;
        this.difficulty = difficulty;
        this.grade = grade;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.imageId = imageId;
        this.correctAnswer = correctAnswer;
        this.solution = solution;
        this.chapter = chapter;
        this.solutionYoutubeUrl = solutionYoutubeUrl;
        this.solutionImageId = solutionImageId;
        this.subject = subject;
        this.createdBy = createdBy;
    }

    // Validation methods
    hasImage(): boolean {
        return !!this.imageId;
    }

    hasCorrectAnswer(): boolean {
        return !!this.correctAnswer;
    }

    hasSolution(): boolean {
        return !!this.solution;
    }

    hasChapter(): boolean {
        return !!this.chapter;
    }

    hasSolutionYoutube(): boolean {
        return !!this.solutionYoutubeUrl;
    }

    hasSolutionImage(): boolean {
        return !!this.solutionImageId;
    }

    hasSubject(): boolean {
        return !!this.subject;
    }

    // Display methods
    getContentDisplay(): string {
        return this.content || 'Nội dung câu hỏi trống';
    }

    getCorrectAnswerDisplay(): string {
        return this.correctAnswer || 'Chưa có đáp án';
    }

    getSolutionDisplay(): string {
        return this.solution || 'Chưa có lời giải';
    }

    getChapterDisplay(): string {
        return this.chapter || 'Chưa xác định chương';
    }

    getSubjectDisplay(): string {
        return this.subject || 'Chưa xác định môn học';
    }

    getTypeDisplay(): string {
        const typeMap = {
            [QuestionType.SINGLE_CHOICE]: 'Trắc nghiệm một đáp án',
            [QuestionType.MULTIPLE_CHOICE]: 'Trắc nghiệm nhiều đáp án',
            [QuestionType.FILL_IN_THE_BLANK]: 'Điền vào chỗ trống',
            [QuestionType.SHORT_ANSWER]: 'Trả lời ngắn',
            [QuestionType.ESSAY]: 'Tự luận'
        };
        return typeMap[this.type] || 'Không xác định';
    }

    getDifficultyDisplay(): string {
        const difficultyMap = {
            [Difficulty.TH]: 'Thông hiểu',
            [Difficulty.NB]: 'Nhận biết',
            [Difficulty.VD]: 'Vận dụng',
            [Difficulty.VDC]: 'Vận dụng cao'
        };
        return difficultyMap[this.difficulty] || 'Không xác định';
    }

    getGradeDisplay(): string {
        return `Lớp ${this.grade}`;
    }

    // Type checking methods
    isSingleChoice(): boolean {
        return this.type === QuestionType.SINGLE_CHOICE;
    }

    isMultipleChoice(): boolean {
        return this.type === QuestionType.MULTIPLE_CHOICE;
    }

    isFillInTheBlank(): boolean {
        return this.type === QuestionType.FILL_IN_THE_BLANK;
    }

    isShortAnswer(): boolean {
        return this.type === QuestionType.SHORT_ANSWER;
    }

    isEssay(): boolean {
        return this.type === QuestionType.ESSAY;
    }

    // Difficulty checking methods
    isBasicLevel(): boolean {
        return this.difficulty === Difficulty.NB || this.difficulty === Difficulty.TH;
    }

    isAdvancedLevel(): boolean {
        return this.difficulty === Difficulty.VD || this.difficulty === Difficulty.VDC;
    }

    // Business logic methods
    isForGrade(grade: number): boolean {
        return this.grade === grade;
    }

    isForSubject(subject: string): boolean {
        return this.subject?.toLowerCase() === subject.toLowerCase();
    }

    isCreatedBy(adminId: number): boolean {
        return this.createdBy === adminId;
    }

    isComplete(): boolean {
        return !!this.content.trim() && this.hasCorrectAnswer();
    }

    canBeUsedInExam(): boolean {
        return this.isComplete() && (this.isSingleChoice() || this.isMultipleChoice() || this.hasCorrectAnswer());
    }

    requiresStatements(): boolean {
        return this.isSingleChoice() || this.isMultipleChoice();
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
