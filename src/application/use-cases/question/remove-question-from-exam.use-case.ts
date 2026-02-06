// src/application/use-cases/question/remove-question-from-exam.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { IQuestionExamRepository } from '../../../domain/repositories/question-exam.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import type { IQuestionRepository } from '../../../domain/repositories/question.repository'
import { RemoveQuestionFromExamDto } from '../../dtos/question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class RemoveQuestionFromExamUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: RemoveQuestionFromExamDto,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const questionExamRepository: IQuestionExamRepository =
                repos.questionExamRepository
            const examRepository: IExamRepository =
                repos.examRepository
            const questionRepository: IQuestionRepository =
                repos.questionRepository

            // Validate exam exists
            const exam = await examRepository.findById(dto.examId)
            if (!exam) {
                throw new NotFoundException(
                    `Đề thi với ID ${dto.examId} không tồn tại`,
                )
            }

            // Validate question exists
            const question = await questionRepository.findById(dto.questionId)
            if (!question) {
                throw new NotFoundException(
                    `Câu hỏi với ID ${dto.questionId} không tồn tại`,
                )
            }

            // Validate question is in the exam
            const questionExam = await questionExamRepository.findByQuestionAndExam(
                dto.questionId,
                dto.examId
            )
            if (!questionExam) {
                throw new NotFoundException(
                    `Câu hỏi ${dto.questionId} không thuộc đề thi ${dto.examId}`,
                )
            }

            // Remove question from exam
            await questionExamRepository.delete(dto.questionId, dto.examId)

            return {
                success: true,
                message: 'Xóa câu hỏi khỏi đề thi thành công',
                data: true,
            }
        })
    }
}
