// src/application/use-cases/homeworkContent/create-homework-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateHomeworkContentDto } from '../../dtos/homeworkContent/create-homework-content.dto'
import { HomeworkContentResponseDto } from '../../dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class CreateHomeworkContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(dto: CreateHomeworkContentDto, adminId?: number): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkContentRepository = repos.homeworkContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const homeworkContent = await homeworkContentRepository.create({
                learningItemId: dto.learningItemId,
                content: dto.content,
                dueDate: dto.dueDate,
                competitionId: dto.competitionId,
                allowLateSubmit: dto.allowLateSubmit,
            })

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.HOMEWORK_CONTENT.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.HOMEWORK_CONTENT,
                    resourceId: homeworkContent.homeworkContentId.toString(),
                    afterData: {
                        learningItemId: homeworkContent.learningItemId,
                        content: homeworkContent.content,
                        dueDate: homeworkContent.dueDate,
                        competitionId: homeworkContent.competitionId,
                        allowLateSubmit: homeworkContent.allowLateSubmit,
                    },
                })
            }

            return HomeworkContentResponseDto.fromEntity(homeworkContent)
        })

        return BaseResponseDto.success('Homework content created successfully', result)
    }
}
