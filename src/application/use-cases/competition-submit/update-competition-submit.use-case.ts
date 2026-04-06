import { Inject, Injectable } from '@nestjs/common'
import type {
    IAdminAuditLogRepository,
    ICompetitionSubmitRepository,
} from '../../../domain/repositories'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { UpdateCompetitionSubmitDto } from '../../dtos/competition-submit/update-competition-submit.dto'
import { CompetitionSubmitResponseDto } from '../../dtos/competition-submit/competition-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class UpdateCompetitionSubmitUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
    ) { }

    async execute(
        id: number,
        dto: UpdateCompetitionSubmitDto,
        adminId: number,
    ): Promise<BaseResponseDto<CompetitionSubmitResponseDto>> {
        const existingSubmit = await this.competitionSubmitRepository.findById(id)
        if (!existingSubmit) {
            throw new NotFoundException(`Bai nop voi ID ${id} khong ton tai`)
        }

        if (
            dto.status === CompetitionSubmitStatus.SUBMITTED &&
            !dto.submittedAt &&
            !existingSubmit.submittedAt
        ) {
            throw new ValidationException('Chỉnh sửa trạng thái thành đã nộp yêu cầu phải có thời gian nộp bài')
        }

        const updatePayload: any = {
            status: dto.status,
            totalPoints: dto.totalPoints,
            maxPoints: dto.maxPoints,
            timeSpentSeconds: dto.timeSpentSeconds,
            metadata: dto.metadata,
        }

        if (dto.submittedAt !== undefined) {
            updatePayload.submittedAt = new Date(dto.submittedAt)
        }

        const updated = await this.competitionSubmitRepository.update(id, updatePayload)

        await this.auditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.COMPETITION_SUBMIT.UPDATE,
            status: AuditStatus.SUCCESS,
            resourceType: RESOURCE_TYPES.COMPETITION_SUBMIT,
            resourceId: id.toString(),
            beforeData: {
                status: existingSubmit.status,
                submittedAt: existingSubmit.submittedAt,
                gradedAt: existingSubmit.gradedAt,
                totalPoints: existingSubmit.totalPoints,
                maxPoints: existingSubmit.maxPoints,
                timeSpentSeconds: existingSubmit.timeSpentSeconds,
            },
            afterData: {
                status: updated.status,
                submittedAt: updated.submittedAt,
                gradedAt: updated.gradedAt,
                totalPoints: updated.totalPoints,
                maxPoints: updated.maxPoints,
                timeSpentSeconds: updated.timeSpentSeconds,
            },
        })

        return BaseResponseDto.success(
            'Cap nhat bai nop thanh cong',
            CompetitionSubmitResponseDto.fromEntity(updated),
        )
    }
}
