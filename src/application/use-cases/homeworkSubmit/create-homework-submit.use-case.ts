// src/application/use-cases/homeworkSubmit/create-homework-submit.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateHomeworkSubmitDto } from '../../dtos/homeworkSubmit/create-homework-submit.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class CreateHomeworkSubmitUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(dto: CreateHomeworkSubmitDto, adminId?: number): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkSubmitRepository = repos.homeworkSubmitRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const homeworkSubmit = await homeworkSubmitRepository.create({
                homeworkContentId: dto.homeworkContentId,
                studentId: dto.studentId,
                content: dto.content,
            })

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
                    resourceId: homeworkSubmit.homeworkSubmitId.toString(),
                    afterData: {
                        homeworkContentId: homeworkSubmit.homeworkContentId,
                        studentId: homeworkSubmit.studentId,
                        content: homeworkSubmit.content,
                    },
                })
            }

            return HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)
        })

        return BaseResponseDto.success('Homework submit created successfully', result)
    }
}
