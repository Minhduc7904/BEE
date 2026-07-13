// src/application/use-cases/homeworkContent/delete-homework-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { HOMEWORK_SUBMIT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'

@Injectable()
export class DeleteHomeworkContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, adminId?: number): Promise<BaseResponseDto<null>> {
        await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkContentRepository = repos.homeworkContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository
            const homeworkSubmitRepository = repos.homeworkSubmitRepository
            const mediaUsageRepository = repos.mediaUsageRepository

            const homeworkContent = await homeworkContentRepository.findById(id)
            if (!homeworkContent) {
                throw new NotFoundException(`Homework content with ID ${id} not found`)
            }

            const homeworkSubmits = await homeworkSubmitRepository.findByHomeworkContent(id)
            await Promise.all(
                homeworkSubmits.map((submit) =>
                    mediaUsageRepository.detachByEntity(
                        EntityType.HOMEWORK_SUBMIT,
                        submit.homeworkSubmitId,
                        HOMEWORK_SUBMIT_MEDIA_FIELDS.ATTACHMENTS,
                    ),
                ),
            )

            await homeworkContentRepository.delete(id)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.HOMEWORK_CONTENT.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.HOMEWORK_CONTENT,
                    resourceId: homeworkContent.homeworkContentId.toString(),
                    beforeData: {
                        learningItemId: homeworkContent.learningItemId,
                        type: homeworkContent.type,
                        content: homeworkContent.content,
                        dueDate: homeworkContent.dueDate,
                        competitionId: homeworkContent.competitionId,
                        allowLateSubmit: homeworkContent.allowLateSubmit,
                    },
                })
            }
        })

        return BaseResponseDto.success('Homework content deleted successfully', null)
    }
}
