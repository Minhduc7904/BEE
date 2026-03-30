import { BaseResponseDto } from '../common/base-response.dto'
import { ExamAttempt } from '../../../domain/entities/exam/exam-attempt.entity'
import { QuestionAnswer } from '../../../domain/entities/exam/question-answer.entity'
import { Question } from '../../../domain/entities/exam/question.entity'
import { Difficulty, QuestionType, TypeOfExam } from '../../../shared/enums'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'

export class StudentExamAttemptResultStatementDto {
    statementId: number
    content: string
    processedContent?: string | null
    order?: number | null
    isCorrect?: boolean | null
}

export class StudentExamAttemptResultQuestionChapterDto {
    chapterId: number
    name?: string | null
}

export class StudentExamAttemptResultQuestionDto {
    questionId: number
    content: string
    processedContent?: string | null
    type: QuestionType
    difficulty?: Difficulty | null
    grade?: number | null
    pointsOrigin?: number | null
    correctAnswer?: string | null
    solution?: string | null
    processedSolution?: string | null
    solutionYoutubeUrl?: string | null
    chapters: StudentExamAttemptResultQuestionChapterDto[]
    statements: StudentExamAttemptResultStatementDto[]
    answer?: StudentExamAttemptResultAnswerDto | null
}

export class StudentExamAttemptResultAnswerDto {
    questionAnswerId: number
    questionId: number
    answer?: string | null
    selectedStatementIds?: number[] | null
    isCorrect?: boolean | null
    points?: number | null
    maxPoints?: number | null
    scorePercentage?: number | null
    timeSpentSeconds?: number | null
}

export class StudentExamAttemptResultDto {
    attemptId: number
    examId: number
    examTitle?: string
    typeOfExam?: TypeOfExam | null
    studentId: number
    status: ExamAttemptStatus
    startedAt: Date
    endAt?: Date | null
    duration?: number | null
    points?: number | null
    maxPoints?: number | null
    score?: number | null

    questions: StudentExamAttemptResultQuestionDto[]
    totalQuestions: number
    answeredQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    unansweredQuestions: number

    static fromEntity(
        attempt: ExamAttempt,
        questions: Question[],
        answers: QuestionAnswer[],
    ): StudentExamAttemptResultDto {
        const dto = new StudentExamAttemptResultDto()

        dto.attemptId = attempt.attemptId
        dto.examId = attempt.examId
        dto.examTitle = attempt.exam?.title
        dto.typeOfExam = attempt.exam?.typeOfExam ?? null
        dto.studentId = attempt.studentId
        dto.status = attempt.status
        dto.startedAt = attempt.startedAt
        dto.endAt = attempt.endAt ?? null
        dto.duration = attempt.duration ?? null
        dto.points = attempt.points ?? null
        dto.maxPoints = attempt.maxPoints ?? null
        dto.score = attempt.score ?? null

        const answerMap = new Map<number, QuestionAnswer>()
        for (const answer of answers) {
            answerMap.set(answer.questionId, answer)
        }

        dto.questions = questions.map((question) => {
            const questionDto = new StudentExamAttemptResultQuestionDto()
            questionDto.questionId = question.questionId
            questionDto.content = question.content
            questionDto.type = question.type
            questionDto.difficulty = question.difficulty ?? null
            questionDto.grade = question.grade ?? null
            questionDto.pointsOrigin = question.pointsOrigin ?? null
            questionDto.correctAnswer = question.correctAnswer ?? null
            questionDto.solution = question.solution ?? null
            questionDto.solutionYoutubeUrl = question.solutionYoutubeUrl ?? null
            questionDto.chapters = (question.questionChapters ?? []).map((item) => {
                const chapterDto = new StudentExamAttemptResultQuestionChapterDto()
                chapterDto.chapterId = item.chapterId
                chapterDto.name = item.chapter?.name ?? null
                return chapterDto
            })

            questionDto.statements = (question.statements ?? []).map((statement) => {
                const statementDto = new StudentExamAttemptResultStatementDto()
                statementDto.statementId = statement.statementId
                statementDto.content = statement.content
                statementDto.order = statement.order ?? null
                statementDto.isCorrect = statement.isCorrect ?? null
                return statementDto
            })

            const answer = answerMap.get(question.questionId)
            if (answer) {
                const answerDto = new StudentExamAttemptResultAnswerDto()
                answerDto.questionAnswerId = answer.questionAnswerId
                answerDto.questionId = answer.questionId
                answerDto.answer = answer.answer ?? null
                answerDto.selectedStatementIds = answer.selectedStatementIds ?? null
                answerDto.isCorrect = answer.isCorrect ?? null
                answerDto.points = answer.points ?? null
                answerDto.maxPoints = answer.maxPoints ?? null
                answerDto.timeSpentSeconds = answer.timeSpentSeconds ?? null

                const sp =
                    answer.maxPoints != null &&
                        Number(answer.maxPoints) > 0 &&
                        answer.points != null
                        ? Math.round((Number(answer.points) / Number(answer.maxPoints)) * 100)
                        : null
                answerDto.scorePercentage = sp
                questionDto.answer = answerDto
            } else {
                questionDto.answer = null
            }

            return questionDto
        })

        dto.totalQuestions = dto.questions.length
        dto.answeredQuestions = dto.questions.filter((item) => item.answer !== null).length
        dto.correctAnswers = dto.questions.filter((item) => item.answer?.isCorrect === true).length
        dto.incorrectAnswers = dto.questions.filter((item) => item.answer?.isCorrect === false).length
        dto.unansweredQuestions = dto.questions.filter((item) => item.answer === null).length

        return dto
    }
}

export class StudentExamAttemptResultResponseDto extends BaseResponseDto<StudentExamAttemptResultDto> { }
