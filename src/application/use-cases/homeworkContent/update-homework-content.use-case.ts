// src/application/use-cases/homeworkContent/update-homework-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { UpdateHomeworkContentDto } from '../../dtos/homeworkContent/update-homework-content.dto'
import { HomeworkContentResponseDto } from '../../dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class UpdateHomeworkContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: UpdateHomeworkContentDto, adminId?: number): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkContentRepository = repos.homeworkContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingHomeworkContent = await homeworkContentRepository.findById(id)
            if (!existingHomeworkContent) {
                throw new NotFoundException(`Homework content with ID ${id} not found`)
            }

            const homeworkContent = await homeworkContentRepository.update(id, dto)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.HOMEWORK_CONTENT.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.HOMEWORK_CONTENT,
                    resourceId: homeworkContent.homeworkContentId.toString(),
                    beforeData: {
                        content: existingHomeworkContent.content,
                        dueDate: existingHomeworkContent.dueDate,
                        competitionId: existingHomeworkContent.competitionId,
                        allowLateSubmit: existingHomeworkContent.allowLateSubmit,
                    },
                    afterData: {
                        content: homeworkContent.content,
                        dueDate: homeworkContent.dueDate,
                        competitionId: homeworkContent.competitionId,
                        allowLateSubmit: homeworkContent.allowLateSubmit,
                    },
                })
            }

            return HomeworkContentResponseDto.fromEntity(homeworkContent)
        })

        return BaseResponseDto.success('Homework content updated successfully', result)
    }
}
