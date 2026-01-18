// src/application/use-cases/homeworkSubmit/update-homework-submit.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { UpdateHomeworkSubmitDto } from '../../dtos/homeworkSubmit/update-homework-submit.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class UpdateHomeworkSubmitUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: UpdateHomeworkSubmitDto, adminId?: number): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkSubmitRepository = repos.homeworkSubmitRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingHomeworkSubmit = await homeworkSubmitRepository.findById(id)
            if (!existingHomeworkSubmit) {
                throw new NotFoundException(`Homework submit with ID ${id} not found`)
            }

            const homeworkSubmit = await homeworkSubmitRepository.update(id, dto)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
                    resourceId: homeworkSubmit.homeworkSubmitId.toString(),
                    beforeData: {
                        content: existingHomeworkSubmit.content,
                    },
                    afterData: {
                        content: homeworkSubmit.content,
                    },
                })
            }

            return HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)
        })

        return BaseResponseDto.success('Homework submit updated successfully', result)
    }
}
