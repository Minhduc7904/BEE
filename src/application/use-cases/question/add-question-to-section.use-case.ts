// src/application/use-cases/question/add-question-to-section.use-case.ts
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { IQuestionExamRepository } from '../../../domain/repositories/question-exam.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import type { IQuestionRepository } from '../../../domain/repositories/question.repository'
import type { ISectionRepository } from '../../../domain/repositories/section.repository'
import { AddQuestionToSectionDto } from '../../dtos/question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class AddQuestionToSectionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: AddQuestionToSectionDto,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const questionExamRepository: IQuestionExamRepository =
                repos.questionExamRepository
            const examRepository: IExamRepository =
                repos.examRepository
            const questionRepository: IQuestionRepository =
                repos.questionRepository
            const sectionRepository: ISectionRepository =
                repos.sectionRepository

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

            // If sectionId is provided, validate section exists and belongs to exam
            if (dto.sectionId) {
                const section = await sectionRepository.findById(dto.sectionId)
                if (!section) {
                    throw new NotFoundException(
                        `Phần thi với ID ${dto.sectionId} không tồn tại`,
                    )
                }

                if (section.examId !== dto.examId) {
                    throw new BadRequestException(
                        `Phần thi ${dto.sectionId} không thuộc đề thi ${dto.examId}`,
                    )
                }
            }

            // Check if question already exists in this exam
            const existingQuestionExam = await questionExamRepository.findByQuestionAndExam(
                dto.questionId,
                dto.examId
            )

            // Calculate order if not provided and sectionId is specified
            let order = dto.order
            if (!order && dto.sectionId) {
                // Get all questions in the section to calculate next order
                const questionsInSection = await questionExamRepository.findBySectionId(dto.sectionId)
                order = questionsInSection.length + 1
            }

            if (existingQuestionExam) {
                // Question already exists in exam, update the section and order
                const updateData: any = {
                    sectionId: dto.sectionId || null, // null to unlink from section
                    ...(order && { order: order }),
                    ...(dto.points !== undefined && { points: dto.points }),
                }

                await questionExamRepository.update(
                    dto.questionId,
                    dto.examId,
                    updateData
                )

                const message = dto.sectionId 
                    ? 'Thêm câu hỏi vào phần thi thành công'
                    : 'Gỡ câu hỏi khỏi phần thi thành công'

                return {
                    success: true,
                    message,
                    data: true,
                }
            } else {
                // Create new QuestionExam entry
                // If no sectionId provided, we need a default section or handle this case
                if (!dto.sectionId) {
                    throw new BadRequestException(
                        'Không thể thêm câu hỏi mới vào đề thi mà không chỉ định phần thi',
                    )
                }

                await questionExamRepository.create({
                    questionId: dto.questionId,
                    examId: dto.examId,
                    sectionId: dto.sectionId,
                    order: order || 1,
                    points: dto.points || null,
                })

                return {
                    success: true,
                    message: 'Thêm câu hỏi vào phần thi thành công',
                    data: true,
                }
            }
        })
    }
}
