// src/domain/entities/question.entity.ts

import { QuestionType } from '../../../shared/enums/question-type.enum';
import { Difficulty } from '../../../shared/enums/difficulty.enum';

export class Question {
    questionId: number;
    content: string;
    type: QuestionType;
    imageId?: number;
    correctAnswer?: string;
    solution?: string;
    chapter?: string;
    difficulty: Difficulty;
    solutionYoutubeUrl?: string;
    solutionImageId?: number;
    grade: number;
    subject?: string;
    createdBy?: number;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(data: Partial<Question>) {
        Object.assign(this, data);
    }
}