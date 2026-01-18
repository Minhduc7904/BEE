// src/application/use-cases/homeworkSubmit/grade-homework-submit.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { GradeHomeworkSubmitDto } from '../../dtos/homeworkSubmit/grade-homework-submit.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class GradeHomeworkSubmitUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: GradeHomeworkSubmitDto): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkSubmitRepository = repos.homeworkSubmitRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingHomeworkSubmit = await homeworkSubmitRepository.findById(id)
            if (!existingHomeworkSubmit) {
                throw new NotFoundException(`Homework submit with ID ${id} not found`)
            }

            const homeworkSubmit = await homeworkSubmitRepository.grade(id, {
                points: dto.points,
                graderId: dto.graderId,
                feedback: dto.feedback,
            })

            await adminAuditLogRepository.create({
                adminId: dto.graderId,
                actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.GRADE,
                status: AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
                resourceId: homeworkSubmit.homeworkSubmitId.toString(),
                beforeData: {
                    points: existingHomeworkSubmit.points,
                    feedback: existingHomeworkSubmit.feedback,
                    graderId: existingHomeworkSubmit.graderId,
                },
                afterData: {
                    points: homeworkSubmit.points,
                    feedback: homeworkSubmit.feedback,
                    graderId: homeworkSubmit.graderId,
                    gradedAt: homeworkSubmit.gradedAt,
                },
            })

            return HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)
        })

        return BaseResponseDto.success('Homework submit graded successfully', result)
    }
}
