// src/application/dtos/homeworkSubmit/homework-submit.dto.ts
import { HomeworkSubmit } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'
import { StudentResponseDto } from '../student/student.dto'
import { AdminResponseDto } from '../admin/admin.dto'
import { MediaUsageEntity } from '../../../domain/entities'
import { MediaUsageResponseDto } from '../media-usage/media-usage-response.dto'

export class HomeworkSubmitResponseDto {
    homeworkSubmitId: number
    homeworkContentId: number
    studentId: number
    competitionSubmitId?: number
    submitAt: Date
    content: string
    points?: number
    gradedAt?: Date
    graderId?: number
    feedback?: string
    mediaIds?: number[]
    attachments?: MediaUsageResponseDto[]
    createdAt: Date
    updatedAt: Date
    student?: StudentResponseDto
    grader?: AdminResponseDto

    static fromEntity(
        homeworkSubmit: HomeworkSubmit,
        attachments?: MediaUsageEntity[],
    ): HomeworkSubmitResponseDto {
        const dto = new HomeworkSubmitResponseDto()
        dto.homeworkSubmitId = homeworkSubmit.homeworkSubmitId
        dto.homeworkContentId = homeworkSubmit.homeworkContentId
        dto.studentId = homeworkSubmit.studentId
        dto.competitionSubmitId = homeworkSubmit.competitionSubmitId ?? undefined
        dto.submitAt = homeworkSubmit.submitAt
        dto.content = homeworkSubmit.content
        dto.points = homeworkSubmit.points ?? undefined
        dto.gradedAt = homeworkSubmit.gradedAt ?? undefined
        dto.graderId = homeworkSubmit.graderId ?? undefined
        dto.feedback = homeworkSubmit.feedback ?? undefined
        dto.mediaIds = attachments?.map((attachment) => attachment.mediaId)
        dto.attachments = attachments?.map(MediaUsageResponseDto.fromEntity)
        dto.createdAt = homeworkSubmit.createdAt
        dto.updatedAt = homeworkSubmit.updatedAt

        if (homeworkSubmit.student?.user) {
            dto.student = StudentResponseDto.fromUserWithStudent(homeworkSubmit.student.user, homeworkSubmit.student)
        }

        if (homeworkSubmit.grader?.user) {
            dto.grader = AdminResponseDto.fromUserWithAdmin(homeworkSubmit.grader.user, homeworkSubmit.grader)
        }

        return dto
    }
}

export class HomeworkSubmitListResponseDto extends BaseResponseDto<{
    homeworkSubmits: HomeworkSubmitResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
