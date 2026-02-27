// src/application/use-cases/competition-submit/get-competition-answers.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, IExamRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { ICompetitionAnswerRepository } from '../../../domain/repositories/competition-answer.repository'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { CompetitionAnswersResponseDto, StudentAnswerDto } from '../../dtos/competition-submit/competition-exam.dto'
import { QuestionType } from '../../../shared/enums'
import { DEFAULT_QUESTION_POINTS } from '../../../shared/constants/grading-rules.constants'

interface QuestionInfo {
    questionId: number
    type: QuestionType
    /** Điểm từ QuestionExam (per-exam override) — ưu tiên cao nhất */
    examPoints: number | null
    /** Điểm gốc từ Question.pointsOrigin */
    pointsOrigin: number | null
    /** Tất cả statementId của câu hỏi — cần để build trueFalseAnswers trong response */
    allStatementIds: number[]
}

@Injectable()
export class GetCompetitionAnswersUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('ICompetitionAnswerRepository')
        private readonly competitionAnswerRepository: ICompetitionAnswerRepository,
    ) { }

    async execute(submitId: number, studentId: number): Promise<CompetitionAnswersResponseDto> {
        // 1. Tìm submit
        const submit = await this.competitionSubmitRepository.findById(submitId)
        if (!submit) {
            throw new NotFoundException(`Lần làm bài với ID ${submitId} không tồn tại`)
        }

        // 2. Tìm competition
        const competition = await this.competitionRepository.findById(submit.competitionId)
        if (!competition) {
            throw new NotFoundException('Cuộc thi không tồn tại')
        }
        if (!competition.examId) {
            throw new NotFoundException('Cuộc thi này không có đề thi')
        }

        // 3. Lấy exam với đầy đủ questions
        const exam = await this.examRepository.findByIdWithFullDetails(competition.examId)
        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        // 4. Thu thập tất cả câu hỏi từ exam (sections + top-level)
        const allQuestions: QuestionInfo[] = []

        // Questions trong sections
        if (exam.sections) {
            for (const section of exam.sections) {
                if (section.questions) {
                    for (const qe of section.questions) {
                        if (qe.question) {
                            allQuestions.push({
                                questionId: qe.question.questionId,
                                type: qe.question.type,
                                examPoints: qe.points != null ? Number(qe.points) : null,
                                pointsOrigin: qe.question.pointsOrigin != null ? Number(qe.question.pointsOrigin) : null,
                                allStatementIds: (qe.question.statements ?? []).map((s: any) => s.statementId),
                            })
                        }
                    }
                }
            }
        }

        // Questions không thuộc section nào
        if (exam.questions) {
            for (const qe of exam.questions) {
                if (qe.question && !qe.sectionId) {
                    allQuestions.push({
                        questionId: qe.question.questionId,
                        type: qe.question.type,
                        examPoints: qe.points != null ? Number(qe.points) : null,
                        pointsOrigin: qe.question.pointsOrigin != null ? Number(qe.question.pointsOrigin) : null,
                        allStatementIds: (qe.question.statements ?? []).map((s: any) => s.statementId),
                    })
                }
            }
        }

        // 5. Lấy các câu trả lời hiện có của submit
        const existingAnswers = await this.competitionAnswerRepository.findByCompetitionSubmit(submitId)

        // Tạo map: questionId → CompetitionAnswer để tra cứu nhanh
        const answerMap = new Map(existingAnswers.map(a => [a.questionId, a]))

        // 6. Tìm những câu hỏi chưa có answer → tạo hàng loạt vào DB
        const missingQuestions = allQuestions.filter(q => !answerMap.has(q.questionId))



        if (missingQuestions.length > 0) {
            const newAnswers = await this.competitionAnswerRepository.createMany(
                missingQuestions.map(q => {
                    const examPoints =
                        q.examPoints != null && q.examPoints > 0
                            ? q.examPoints
                            : null;

                    const originPoints =
                        q.pointsOrigin != null && q.pointsOrigin > 0
                            ? q.pointsOrigin
                            : null;

                    return {
                        competitionSubmitId: submitId,
                        questionId: q.questionId,
                        answer: null,
                        selectedStatementIds: null,
                        maxPoints:
                            examPoints ??
                            originPoints ??
                            (DEFAULT_QUESTION_POINTS[q.type] ?? null),
                    };
                }),
            );
            // Thêm vào map
            newAnswers.forEach(a => answerMap.set(a.questionId, a))
        }

        // 7. Trả về đúng thứ tự của exam
        const result: StudentAnswerDto[] = allQuestions.map(q => {
            const answer = answerMap.get(q.questionId)!
            return StudentAnswerDto.fromExistingAnswer(answer, q.type, q.allStatementIds)
        })

        return CompetitionAnswersResponseDto.fromAnswers(result)
    }
}
