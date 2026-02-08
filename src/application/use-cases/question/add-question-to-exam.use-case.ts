// src/application/use-cases/question/add-question-to-exam.use-case.ts
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { IQuestionExamRepository } from '../../../domain/repositories/question-exam.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import type { IQuestionRepository } from '../../../domain/repositories/question.repository'
import { AddQuestionToExamDto } from '../../dtos/question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class AddQuestionToExamUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: AddQuestionToExamDto,
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

            // Check if question already exists in this exam
            const existingQuestionExam = await questionExamRepository.findByQuestionAndExam(
                dto.questionId,
                dto.examId
            )

            if (existingQuestionExam) {
                throw new BadRequestException(
                    `Câu hỏi ${dto.questionId} đã tồn tại trong đề thi ${dto.examId}`,
                )
            }

            // Calculate order if not provided
            let order = dto.order
            if (!order) {
                // Get all questions in the exam to calculate next order
                const questionsInExam = await questionExamRepository.findByExamId(dto.examId)
                const maxOrder = questionsInExam.length > 0 
                    ? Math.max(...questionsInExam.map(q => q.order))
                    : 0
                order = maxOrder + 1
            }

            // Add question to exam
            await questionExamRepository.create({
                questionId: dto.questionId,
                examId: dto.examId,
                sectionId: null, // Not assigned to any section
                order: order,
                points: dto.points || 0,
            })

            return {
                success: true,
                message: 'Thêm câu hỏi vào đề thi thành công',
                data: true,
            }
        })
    }
}
