// src/application/use-cases/homeworkSubmit/delete-homework-submit.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class DeleteHomeworkSubmitUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, adminId?: number): Promise<BaseResponseDto<null>> {
        await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkSubmitRepository = repos.homeworkSubmitRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const homeworkSubmit = await homeworkSubmitRepository.findById(id)
            if (!homeworkSubmit) {
                throw new NotFoundException(`Homework submit with ID ${id} not found`)
            }

            await homeworkSubmitRepository.delete(id)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
                    resourceId: homeworkSubmit.homeworkSubmitId.toString(),
                    beforeData: {
                        homeworkContentId: homeworkSubmit.homeworkContentId,
                        studentId: homeworkSubmit.studentId,
                        content: homeworkSubmit.content,
                        points: homeworkSubmit.points,
                        feedback: homeworkSubmit.feedback,
                    },
                })
            }
        })

        return BaseResponseDto.success('Homework submit deleted successfully', null)
    }
}
