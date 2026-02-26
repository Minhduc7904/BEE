// src/application/dtos/competition-submit/competition-exam.dto.ts
import { Question } from '../../../domain/entities/exam/question.entity'
import { Statement } from '../../../domain/entities/exam/statement.entity'
import { Section } from '../../../domain/entities/exam/section.entity'
import { Exam } from '../../../domain/entities/exam/exam.entity'
import { Competition } from '../../../domain/entities/exam/competition.entity'
import { CompetitionAnswer } from '../../../domain/entities/exam/competition-answer.entity'
import { QuestionType, Visibility } from '../../../shared/enums'
import { BaseResponseDto } from '../common/base-response.dto'

/**
 * Competition info DTO for exam context
 */
export class CompetitionInfoDto {
    competitionId: number
    title: string
    subtitle?: string
    startDate?: Date | null
    endDate?: Date | null
    durationMinutes?: number
    maxAttempts?: number
    visibility: Visibility
    allowLeaderboard: boolean
    allowViewScore: boolean
    allowViewAnswer: boolean
    allowViewSolutionYoutubeUrl: boolean
    allowViewExamContent: boolean
    enableAntiCheating: boolean
    showResultDetail: boolean
    policies?: string
    createdAt: Date
    updatedAt: Date

    static fromEntity(competition: Competition): CompetitionInfoDto {
        return {
            competitionId: competition.competitionId,
            title: competition.title,
            subtitle: competition.subtitle ?? undefined,
            startDate: competition.startDate ?? null,
            endDate: competition.endDate ?? null,
            durationMinutes: competition.durationMinutes ?? undefined,
            maxAttempts: competition.maxAttempts ?? undefined,
            visibility: competition.visibility,
            allowLeaderboard: competition.allowLeaderboard,
            allowViewScore: competition.allowViewScore,
            allowViewAnswer: competition.allowViewAnswer,
            allowViewSolutionYoutubeUrl: competition.allowViewSolutionYoutubeUrl,
            allowViewExamContent: competition.allowViewExamContent,
            enableAntiCheating: competition.enableAntiCheating,
            showResultDetail: competition.showResultDetail,
            policies: competition.policies ?? undefined,
            createdAt: competition.createdAt,
            updatedAt: competition.updatedAt,
        }
    }
}

/**
 * Statement DTO without answer information
 * Dùng cho student khi làm bài - không lộ đáp án
 */
export class CompetitionExamStatementDto {
    statementId: number
    content: string
    processedContent?: string
    order?: number

    static fromEntity(statement: Statement): CompetitionExamStatementDto {
        return {
            statementId: statement.statementId,
            content: statement.content,
            processedContent: undefined,
            order: statement.order ?? undefined,
        }
    }

    static fromEntities(statements: Statement[]): CompetitionExamStatementDto[] {
        return statements
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(s => CompetitionExamStatementDto.fromEntity(s))
    }
}

/**
 * Question DTO without answer information
 * Dùng cho student khi làm bài - không lộ đáp án
 */
export class CompetitionExamQuestionDto {
    questionId: number
    content: string
    processedContent?: string
    type: QuestionType
    order: number
    sectionId?: number
    points?: number
    statements?: CompetitionExamStatementDto[]

    static fromEntity(
        question: Question,
        order: number,
        sectionId?: number,
        points?: number,
    ): CompetitionExamQuestionDto {
        return {
            questionId: question.questionId,
            content: question.content,
            processedContent: undefined,
            type: question.type,
            order,
            sectionId,
            points,
            statements: question.statements
                ? CompetitionExamStatementDto.fromEntities(question.statements)
                : undefined,
        }
    }
}

/**
 * Section DTO with questions (without answers)
 * Hiển thị đầy đủ thông tin section
 */
export class CompetitionExamSectionDto {
    sectionId: number
    examId: number
    title: string
    description?: string
    order: number
    questions: CompetitionExamQuestionDto[]
    createdAt: Date
    updatedAt: Date

    static fromEntity(section: Section): CompetitionExamSectionDto {
        const questions = section.questions
            ?.filter(qe => qe.question) // Filter out questions that are undefined
            .sort((a, b) => a.order - b.order)
            .map(qe =>
                CompetitionExamQuestionDto.fromEntity(
                    qe.question!,
                    qe.order,
                    qe.sectionId ?? undefined,
                    qe.points ?? undefined,
                ),
            ) ?? []

        return {
            sectionId: section.sectionId,
            examId: section.examId,
            title: section.title,
            description: section.description ?? undefined,
            order: section.order,
            questions,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt,
        }
    }

    static fromEntities(sections: Section[]): CompetitionExamSectionDto[] {
        return sections
            .sort((a, b) => a.order - b.order)
            .map(s => CompetitionExamSectionDto.fromEntity(s))
    }
}

/**
 * Exam DTO for competition (without answers)
 * Dùng cho student khi làm bài competition
 */
export class CompetitionExamDto {
    examId: number
    title: string
    description?: string
    grade?: number
    typeOfExam?: string
    sections: CompetitionExamSectionDto[]
    questions: CompetitionExamQuestionDto[] // Questions không thuộc section nào
    totalQuestions: number
    createdAt: Date
    updatedAt: Date

    static fromEntity(exam: Exam): CompetitionExamDto {
        // Lấy questions thuộc sections
        const sections = exam.sections
            ? CompetitionExamSectionDto.fromEntities(exam.sections)
            : []

        // Lấy questions không thuộc section nào
        const questionsWithoutSection = exam.questions
            ?.filter(qe => !qe.sectionId && qe.question) // Filter out undefined questions
            .sort((a, b) => a.order - b.order)
            .map(qe =>
                CompetitionExamQuestionDto.fromEntity(
                    qe.question!,
                    qe.order,
                    undefined,
                    qe.points ?? undefined,
                ),
            ) ?? []

        // Tính tổng số câu hỏi
        const totalQuestionsInSections = sections.reduce((sum, s) => sum + s.questions.length, 0)
        const totalQuestions = totalQuestionsInSections + questionsWithoutSection.length

        return {
            examId: exam.examId,
            title: exam.title,
            description: exam.description ?? undefined,
            grade: exam.grade ?? undefined,
            typeOfExam: exam.typeOfExam ?? undefined,
            sections,
            questions: questionsWithoutSection,
            totalQuestions,
            createdAt: exam.createdAt,
            updatedAt: exam.updatedAt,
        }
    }
}

/**
 * Combined response data: competition info + exam content
 */
export class CompetitionWithExamData {
    competition: CompetitionInfoDto
    exam: CompetitionExamDto
}

/**
 * Response DTO for competition exam
 */
export class CompetitionExamResponseDto extends BaseResponseDto<CompetitionWithExamData> {
    static fromExam(competition: Competition, exam: Exam): CompetitionExamResponseDto {
        const dto = CompetitionExamDto.fromEntity(exam)
        return {
            success: true,
            message: 'Lấy đề thi thành công',
            data: {
                competition: CompetitionInfoDto.fromEntity(competition),
                exam: CompetitionExamDto.fromEntity(exam),
            },
        }
    }
}

/**
 * DTO đại diện cho câu trả lời của học sinh cho một câu hỏi.
 * Nếu học sinh chưa trả lời, trả về giá trị mặc định theo loại câu hỏi.
 */
export class StudentAnswerDto {
    /** null nếu học sinh chưa trả lời câu hỏi này */
    competitionAnswerId: number | null
    competitionSubmitId: number
    questionId: number
    questionType: QuestionType
    /** Câu trả lời dạng text - dùng cho SHORT_ANSWER, ESSAY */
    answer: string | null
    /** IDs của statements đã chọn - dùng cho SINGLE_CHOICE, MULTIPLE_CHOICE */
    selectedStatementIds: number[]
    /**
     * Câu trả lời đúng/sai cho từng mệnh đề - chỉ dùng cho TRUE_FALSE.
     * - isTrue = null  : học sinh chưa trả lời mệnh đề này
     * - isTrue = true  : học sinh đánh dấu mệnh đề là đúng
     * - isTrue = false : học sinh đánh dấu mệnh đề là sai
     */
    trueFalseAnswers?: { statementId: number; isTrue: boolean | null }[]
    isAnswered: boolean
    timeSpentSeconds: number | null

    /**
     * @param answer - CompetitionAnswer entity
     * @param questionType - loại câu hỏi
     * @param allStatementIds - tất cả statementId của câu hỏi (cần cho TRUE_FALSE)
     */
    static fromExistingAnswer(
        answer: CompetitionAnswer,
        questionType: QuestionType,
        allStatementIds: number[] = [],
    ): StudentAnswerDto {
        const hasText = Boolean(answer.answer && answer.answer.trim().length > 0)
        const hasSelected = Boolean(answer.selectedStatementIds && answer.selectedStatementIds.length > 0)

        const isTrueFalse = questionType === QuestionType.TRUE_FALSE

        let trueFalseAnswers: { statementId: number; isTrue: boolean | null }[] | undefined = undefined
        let isTrueFalseAnswered = false

        if (isTrueFalse) {
            // Cố gắng parse JSON map {statementId: boolean|null} từ answer field
            let trueFalseMap: Record<string, boolean | null> | null = null
            if (answer.answer) {
                try {
                    const parsed = JSON.parse(answer.answer)
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        trueFalseMap = parsed
                    }
                } catch { /* không phải JSON — legacy data */ }
            }

            if (trueFalseMap !== null) {
                // Dữ liệu mới: dùng JSON map để lấy isTrue chính xác khỏ null
                trueFalseAnswers = allStatementIds.map(statementId => ({
                    statementId,
                    isTrue: statementId.toString() in trueFalseMap!
                        ? trueFalseMap![statementId.toString()]
                        : null,
                }))
                isTrueFalseAnswered = trueFalseAnswers.length > 0 && trueFalseAnswers.every(a => a.isTrue !== null)
            } else {
                // Legacy / fallback: dùng selectedStatementIds
                const hasSubmitted = answer.selectedStatementIds !== null && answer.selectedStatementIds !== undefined
                const selectedSet = new Set(answer.selectedStatementIds ?? [])
                trueFalseAnswers = allStatementIds.map(statementId => ({
                    statementId,
                    isTrue: hasSubmitted ? selectedSet.has(statementId) : null,
                }))
                isTrueFalseAnswered = hasSubmitted && trueFalseAnswers.length > 0 && trueFalseAnswers.every(a => a.isTrue !== null)
            }
        }

        return {
            competitionAnswerId: answer.competitionAnswerId,
            competitionSubmitId: answer.competitionSubmitId,
            questionId: answer.questionId,
            questionType,
            // TRUE_FALSE: answer field chứa JSON nội bộ, không cần expose ra ngoài
            answer: isTrueFalse ? null : (answer.answer ?? null),
            selectedStatementIds: isTrueFalse ? [] : (answer.selectedStatementIds ?? []),
            trueFalseAnswers,
            isAnswered: isTrueFalse ? isTrueFalseAnswered : (hasText || hasSelected),
            timeSpentSeconds: answer.timeSpentSeconds ?? null,
        }
    }

    static createDefault(competitionSubmitId: number, questionId: number, questionType: QuestionType): StudentAnswerDto {
        return {
            competitionAnswerId: null,
            competitionSubmitId,
            questionId,
            questionType,
            answer: null,
            selectedStatementIds: [],
            trueFalseAnswers: questionType === QuestionType.TRUE_FALSE ? [] : undefined,
            isAnswered: false,
            timeSpentSeconds: null,
        }
    }
}

/**
 * Response DTO for student answers list
 */
export class CompetitionAnswersResponseDto extends BaseResponseDto<StudentAnswerDto[]> {
    static fromAnswers(answers: StudentAnswerDto[]): CompetitionAnswersResponseDto {
        return {
            success: true,
            message: 'Lấy câu trả lời thành công',
            data: answers,
        }
    }
}
