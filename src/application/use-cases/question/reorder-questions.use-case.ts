// src/application/use-cases/question/reorder-questions.use-case.ts
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { IQuestionExamRepository } from '../../../domain/repositories/question-exam.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import { ReorderQuestionsDto } from '../../dtos/question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class ReorderQuestionsUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: ReorderQuestionsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const questionExamRepository: IQuestionExamRepository =
                repos.questionExamRepository
            const examRepository: IExamRepository =
                repos.examRepository

            if (!dto.items || dto.items.length === 0) {
                throw new BadRequestException('Danh sách câu hỏi không được rỗng')
            }

            // Validate exam exists
            const exam = await examRepository.findById(dto.examId)
            if (!exam) {
                throw new NotFoundException(
                    `Đề thi với ID ${dto.examId} không tồn tại`,
                )
            }

            // Validate all questions exist and belong to the exam
            for (const item of dto.items) {
                const questionExam = await questionExamRepository.findByQuestionAndExam(
                    item.questionId,
                    dto.examId
                )
                if (!questionExam) {
                    throw new NotFoundException(
                        `Câu hỏi ${item.questionId} không thuộc đề thi ${dto.examId}`,
                    )
                }
            }

            // Update order for each question in the exam
            for (const item of dto.items) {
                await questionExamRepository.update(
                    item.questionId,
                    dto.examId,
                    { order: item.order }
                )
            }

            return {
                success: true,
                message: 'Cập nhật thứ tự câu hỏi thành công',
                data: true,
            }
        })
    }
}
