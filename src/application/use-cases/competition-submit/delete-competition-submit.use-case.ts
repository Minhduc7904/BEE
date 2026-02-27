// src/application/use-cases/competition-submit/delete-competition-submit.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionSubmitRepository, IAdminAuditLogRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class DeleteCompetitionSubmitUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
    ) { }

    async execute(id: number, adminId: number): Promise<BaseResponseDto<null>> {
        const submit = await this.competitionSubmitRepository.findById(id)

        if (!submit) {
            throw new NotFoundException(`Bài nộp với ID ${id} không tồn tại`)
        }

        await this.competitionSubmitRepository.delete(id)

        await this.auditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.COMPETITION_SUBMIT.DELETE,
            status: AuditStatus.SUCCESS,
            resourceType: RESOURCE_TYPES.COMPETITION_SUBMIT,
            resourceId: id.toString(),
            beforeData: {
                competitionId: submit.competitionId,
                studentId: submit.studentId,
                attemptNumber: submit.attemptNumber,
                status: submit.status,
            },
        })

        return BaseResponseDto.success('Xoá bài nộp thành công', null)
    }
}
