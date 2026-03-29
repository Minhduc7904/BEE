import { BaseResponseDto } from '../common/base-response.dto'
import { Difficulty, TypeOfExam } from '../../../shared/enums'
import { QuestionType } from '../../../shared/enums/question-type.enum'

export class PublicStudentCompetitionExamStatementDto {
    statementId: number
    content: string
    processedContent?: string
    order?: number | null
}

export class PublicStudentCompetitionExamQuestionChapterDto {
    chapterId: number
    name?: string | null
}

export class PublicStudentCompetitionExamQuestionDto {
    questionId: number
    sectionId?: number | null
    order?: number | null
    type: QuestionType
    content: string
    processedContent?: string
    difficulty?: Difficulty | null
    pointsOrigin?: number | null
    chapters: PublicStudentCompetitionExamQuestionChapterDto[]
    statements: PublicStudentCompetitionExamStatementDto[]
}

export class PublicStudentCompetitionExamSectionDto {
    sectionId: number
    title: string
    description?: string | null
    processedDescription?: string | null
    order: number
}

export class PublicStudentCompetitionExamDataDto {
    examId: number
    title: string
    attemptStatus?: 'ATTEMPTED' | 'NOT_ATTEMPTED'
    description?: string | null
    processedDescription?: string | null
    grade?: number
    subject?: {
        subjectId?: number | null
        name?: string | null
    }
    createdBy: number
    typeOfExam?: TypeOfExam | null
    sections: PublicStudentCompetitionExamSectionDto[]
    questions: PublicStudentCompetitionExamQuestionDto[]
}

export class PublicStudentCompetitionExamResponseDto extends BaseResponseDto<PublicStudentCompetitionExamDataDto> { }
