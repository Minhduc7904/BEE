// src/application/use-cases/homeworkContent/create-homework-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateHomeworkContentDto } from '../../dtos/homeworkContent/create-homework-content.dto'
import { HomeworkContentResponseDto } from '../../dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { Visibility } from 'src/shared/enums'

@Injectable()
export class CreateHomeworkContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(dto: CreateHomeworkContentDto, adminId?: number): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkContentRepository = repos.homeworkContentRepository
            const competitionRepository = repos.competitionRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Validate competition if competitionId is provided
            if (dto.competitionId) {
                await this.validateCompetition(dto.competitionId, dto.dueDate, competitionRepository)
            }

            const homeworkContent = await homeworkContentRepository.create({
                learningItemId: dto.learningItemId,
                content: dto.content,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                competitionId: dto.competitionId,
                allowLateSubmit: dto.allowLateSubmit,
                updatePointsOnLateSubmit: dto.updatePointsOnLateSubmit,
                updatePointsOnReSubmit: dto.updatePointsOnReSubmit,
                updateMaxPoints: dto.updateMaxPoints,
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
                        updatePointsOnLateSubmit: homeworkContent.updatePointsOnLateSubmit,
                        updatePointsOnReSubmit: homeworkContent.updatePointsOnReSubmit,
                        updateMaxPoints: homeworkContent.updateMaxPoints,
                    },
                })
            }

            return HomeworkContentResponseDto.fromEntity(homeworkContent)
        })

        return BaseResponseDto.success('Homework content created successfully', result)
    }

    /**
     * Validate competition before attaching to homework
     * @param competitionId - Competition ID to validate
     * @param dueDate - Homework due date
     * @param competitionRepository - Competition repository
     */
    private async validateCompetition(
        competitionId: number,
        dueDate: Date | undefined,
        competitionRepository: any,
    ): Promise<void> {
        // Check if competition exists
        const competition = await competitionRepository.findById(competitionId)
        if (!competition) {
            throw new NotFoundException(`Cuộc thi với ID ${competitionId} không tồn tại`)
        }

        // Check if competition is not DRAFT
        if (competition.visibility === Visibility.DRAFT) {
            throw new ConflictException('Không thể gắn bài tập với cuộc thi đang ở trạng thái nháp (DRAFT)')
        }

        // Check if competition has not ended (if endDate exists)
        if (competition.endDate) {
            const now = new Date()
            if (now > competition.endDate) {
                throw new ConflictException('Không thể gắn bài tập với cuộc thi đã kết thúc')
            }
        }

        // Check if homework dueDate is before or equal to competition endDate (if both exist)
        if (dueDate && competition.endDate) {
            const dueDateObj = new Date(dueDate)
            if (dueDateObj > competition.endDate) {
                throw new ConflictException(
                    `Ngày hết hạn nộp bài (${dueDateObj.toISOString()}) phải trước hoặc bằng ngày kết thúc cuộc thi (${competition.endDate.toISOString()})`
                )
            }
        }
    }
}
