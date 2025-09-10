// src/domain/entities/exam/question-exam.entity.ts

export class QuestionExam {
    // Required properties
    questionId: number;
    examId: number;
    order: number;
    createdAt: Date;

    // Optional properties
    points?: number;

    constructor(
        questionId: number,
        examId: number,
        order: number,
        createdAt: Date,
        points?: number
    ) {
        this.questionId = questionId;
        this.examId = examId;
        this.order = order;
        this.createdAt = createdAt;
        this.points = points;
    }

    // Validation methods
    hasPoints(): boolean {
        return this.points !== undefined && this.points !== null;
    }

    hasValidOrder(): boolean {
        return this.order > 0;
    }

    // Display methods
    getOrderDisplay(): string {
        return `Câu ${this.order}`;
    }

    getPointsDisplay(): string {
        return this.hasPoints() ? `${this.points} điểm` : 'Chưa chấm điểm';
    }

    // Business logic methods
    belongsToExam(examId: number): boolean {
        return this.examId === examId;
    }

    belongsToQuestion(questionId: number): boolean {
        return this.questionId === questionId;
    }

    belongsTo(examId: number, questionId: number): boolean {
        return this.belongsToExam(examId) && this.belongsToQuestion(questionId);
    }

    isValidPoints(): boolean {
        return !this.hasPoints() || (this.points! >= 0 && this.points! <= 100);
    }

    isFirstQuestion(): boolean {
        return this.order === 1;
    }

    // Order comparison methods
    isBefore(other: QuestionExam): boolean {
        // Chỉ so sánh nếu cùng exam
        if (this.examId !== other.examId) return false;
        return this.order < other.order;
    }

    isAfter(other: QuestionExam): boolean {
        // Chỉ so sánh nếu cùng exam
        if (this.examId !== other.examId) return false;
        return this.order > other.order;
    }

    hasSameOrder(other: QuestionExam): boolean {
        // Chỉ so sánh nếu cùng exam
        if (this.examId !== other.examId) return false;
        return this.order === other.order;
    }

    isNextTo(other: QuestionExam): boolean {
        // Chỉ so sánh nếu cùng exam
        if (this.examId !== other.examId) return false;
        return Math.abs(this.order - other.order) === 1;
    }

    // Points methods
    hasHigherPointsThan(other: QuestionExam): boolean {
        if (!this.hasPoints() || !other.hasPoints()) return false;
        return this.points! > other.points!;
    }

    hasLowerPointsThan(other: QuestionExam): boolean {
        if (!this.hasPoints() || !other.hasPoints()) return false;
        return this.points! < other.points!;
    }

    hasSamePointsAs(other: QuestionExam): boolean {
        if (!this.hasPoints() || !other.hasPoints()) return false;
        return this.points === other.points;
    }

    // Date methods
    isCreatedAfter(date: Date): boolean {
        return this.createdAt > date;
    }

    isCreatedBefore(date: Date): boolean {
        return this.createdAt < date;
    }

    wasCreatedToday(): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.createdAt >= today && this.createdAt < tomorrow;
    }

    // Static helper methods for collections
    static sortByOrder(questionExams: QuestionExam[]): QuestionExam[] {
        return questionExams.sort((a, b) => a.order - b.order);
    }

    static filterByExam(questionExams: QuestionExam[], examId: number): QuestionExam[] {
        return questionExams.filter(qe => qe.belongsToExam(examId));
    }

    static filterByQuestion(questionExams: QuestionExam[], questionId: number): QuestionExam[] {
        return questionExams.filter(qe => qe.belongsToQuestion(questionId));
    }

    static getTotalPoints(questionExams: QuestionExam[]): number {
        return questionExams
            .filter(qe => qe.hasPoints())
            .reduce((total, qe) => total + qe.points!, 0);
    }

    static getMaxOrder(questionExams: QuestionExam[]): number {
        if (questionExams.length === 0) return 0;
        return Math.max(...questionExams.map(qe => qe.order));
    }

    static getMinOrder(questionExams: QuestionExam[]): number {
        if (questionExams.length === 0) return 0;
        return Math.min(...questionExams.map(qe => qe.order));
    }

    static hasValidOrderSequence(questionExams: QuestionExam[]): boolean {
        const sorted = this.sortByOrder(questionExams);
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].order !== i + 1) {
                return false;
            }
        }
        return true;
    }

    static getNextOrder(questionExams: QuestionExam[]): number {
        return this.getMaxOrder(questionExams) + 1;
    }

    static getQuestionsWithoutPoints(questionExams: QuestionExam[]): QuestionExam[] {
        return questionExams.filter(qe => !qe.hasPoints());
    }

    static getQuestionsWithPoints(questionExams: QuestionExam[]): QuestionExam[] {
        return questionExams.filter(qe => qe.hasPoints());
    }

    // Validation for entire exam
    static validateExamQuestions(questionExams: QuestionExam[]): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check for duplicate orders
        const orders = questionExams.map(qe => qe.order);
        const uniqueOrders = new Set(orders);
        if (orders.length !== uniqueOrders.size) {
            errors.push('Có câu hỏi trùng thứ tự');
        }

        // Check for valid order sequence
        if (!this.hasValidOrderSequence(questionExams)) {
            errors.push('Thứ tự câu hỏi không liên tục');
        }

        // Check for valid points
        const invalidPoints = questionExams.filter(qe => !qe.isValidPoints());
        if (invalidPoints.length > 0) {
            errors.push('Có câu hỏi có điểm số không hợp lệ');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
