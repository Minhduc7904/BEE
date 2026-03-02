// src/application/use-cases/homeworkContent/update-homework-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { UpdateHomeworkContentDto } from '../../dtos/homeworkContent/update-homework-content.dto'
import { HomeworkContentResponseDto } from '../../dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { Visibility } from 'src/shared/enums'

@Injectable()
export class UpdateHomeworkContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: UpdateHomeworkContentDto, adminId?: number): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const homeworkContentRepository = repos.homeworkContentRepository
            const competitionRepository = repos.competitionRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingHomeworkContent = await homeworkContentRepository.findById(id)
            if (!existingHomeworkContent) {
                throw new NotFoundException(`Homework content with ID ${id} not found`)
            }

            // Build update data với chỉ các giá trị thay đổi
            const updateData: any = {}
            
            if (dto.content !== undefined && dto.content !== existingHomeworkContent.content) {
                updateData.content = dto.content
            }
            
            if (dto.dueDate !== undefined) {
                const existingDueDate = existingHomeworkContent.dueDate ? existingHomeworkContent.dueDate.toISOString() : null
                const newDueDate = dto.dueDate ? new Date(dto.dueDate).toISOString() : null
                if (existingDueDate !== newDueDate) {
                    updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null
                }
            }
            
            if (dto.competitionId !== undefined && dto.competitionId !== existingHomeworkContent.competitionId) {
                updateData.competitionId = dto.competitionId
            }
            
            if (dto.allowLateSubmit !== undefined && dto.allowLateSubmit !== existingHomeworkContent.allowLateSubmit) {
                updateData.allowLateSubmit = dto.allowLateSubmit
            }

            if (dto.updatePointsOnLateSubmit !== undefined && dto.updatePointsOnLateSubmit !== existingHomeworkContent.updatePointsOnLateSubmit) {
                updateData.updatePointsOnLateSubmit = dto.updatePointsOnLateSubmit
            }

            if (dto.updatePointsOnReSubmit !== undefined && dto.updatePointsOnReSubmit !== existingHomeworkContent.updatePointsOnReSubmit) {
                updateData.updatePointsOnReSubmit = dto.updatePointsOnReSubmit
            }

            if (dto.updateMaxPoints !== undefined && dto.updateMaxPoints !== existingHomeworkContent.updateMaxPoints) {
                updateData.updateMaxPoints = dto.updateMaxPoints
            }

            // Nếu không có gì thay đổi, trả về dữ liệu hiện tại
            if (Object.keys(updateData).length === 0) {
                return HomeworkContentResponseDto.fromEntity(existingHomeworkContent)
            }

            // Validate competition nếu có thay đổi liên quan đến competitionId hoặc dueDate
            if (updateData.competitionId !== undefined) {
                const finalDueDate = updateData.dueDate !== undefined ? updateData.dueDate : existingHomeworkContent.dueDate
                await this.validateCompetition(updateData.competitionId, finalDueDate, competitionRepository)
            }
            // Nếu chỉ cập nhật dueDate và có competition hiện tại
            else if (updateData.dueDate !== undefined && existingHomeworkContent.competitionId) {
                await this.validateCompetition(existingHomeworkContent.competitionId, updateData.dueDate, competitionRepository)
            }

            const homeworkContent = await homeworkContentRepository.update(id, updateData)

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
                        updatePointsOnLateSubmit: existingHomeworkContent.updatePointsOnLateSubmit,
                        updatePointsOnReSubmit: existingHomeworkContent.updatePointsOnReSubmit,
                        updateMaxPoints: existingHomeworkContent.updateMaxPoints,
                    },
                    afterData: {
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

        return BaseResponseDto.success('Homework content updated successfully', result)
    }

    /**
     * Validate competition before attaching to homework
     * @param competitionId - Competition ID to validate (can be null to remove competition)
     * @param dueDate - Homework due date
     * @param competitionRepository - Competition repository
     */
    private async validateCompetition(
        competitionId: number | null | undefined,
        dueDate: Date | null | undefined,
        competitionRepository: any,
    ): Promise<void> {
        // If competitionId is null, no validation needed (removing competition)
        if (competitionId === null || competitionId === undefined) {
            return
        }

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
