// src/application/dtos/learningItem/student-learning-item.dto.ts
import { LearningItem, StudentLearningItem } from '../../../domain/entities'
import { LearningItemType } from '../../../shared/enums'
import { HomeworkContentResponseDto } from '../homeworkContent/homework-content.dto'
import { DocumentContentResponseDto, MediaFileDto } from '../documentContent/document-content.dto'
import { YoutubeContentResponseDto } from '../youtubeContent/youtube-content.dto'
import { VideoContentResponseDto } from '../videoContent/video-content.dto'

/**
 * DTO cho Student Learning Item Progress
 */
export class StudentLearningItemProgressDto {
    isLearned: boolean
    learnedAt?: Date

    static fromEntity(studentLearningItem: StudentLearningItem | null): StudentLearningItemProgressDto {
        const dto = new StudentLearningItemProgressDto()
        dto.isLearned = studentLearningItem?.isLearned ?? false
        dto.learnedAt = studentLearningItem?.learnedAt ?? undefined
        return dto
    }
}

/**
 * DTO trả về thông tin Learning Item chi tiết cho Student
 * Bao gồm: thông tin cơ bản, content tùy loại, và progress
 */
export class StudentLearningItemResponseDto {
    learningItemId: number
    type: LearningItemType
    title: string
    description?: string
    createdAt: Date
    updatedAt: Date

    // Progress của student
    progress: StudentLearningItemProgressDto

    // Content tùy theo type (chỉ 1 trong 4 sẽ có giá trị)
    homeworkContents?: HomeworkContentResponseDto[]
    documentContents?: DocumentContentResponseDto[]
    youtubeContents?: YoutubeContentResponseDto[]
    videoContents?: VideoContentResponseDto[]

    static fromEntity(
        learningItem: LearningItem,
        studentLearningItem: StudentLearningItem | null,
        mediaFilesMap?: Map<number, MediaFileDto[]>,
    ): StudentLearningItemResponseDto {
        const dto = new StudentLearningItemResponseDto()
        
        // Basic info
        dto.learningItemId = learningItem.learningItemId
        dto.type = learningItem.type
        dto.title = learningItem.title
        dto.description = learningItem.description ?? undefined
        dto.createdAt = learningItem.createdAt
        dto.updatedAt = learningItem.updatedAt

        // Progress
        dto.progress = StudentLearningItemProgressDto.fromEntity(studentLearningItem)

        // Content theo type
        if (learningItem.type === LearningItemType.HOMEWORK && learningItem.homeworkContents) {
            dto.homeworkContents = learningItem.homeworkContents.map(hc => 
                HomeworkContentResponseDto.fromEntity(hc)
            )
        }

        if (learningItem.type === LearningItemType.DOCUMENT && learningItem.documentContents) {
            dto.documentContents = learningItem.documentContents.map(dc => {
                const mediaFiles = mediaFilesMap?.get(dc.documentContentId)
                return DocumentContentResponseDto.fromEntity(dc, mediaFiles)
            })
        }

        if (learningItem.type === LearningItemType.YOUTUBE && learningItem.youtubeContents) {
            dto.youtubeContents = learningItem.youtubeContents.map(yc => 
                YoutubeContentResponseDto.fromEntity(yc)
            )
        }

        if (learningItem.type === LearningItemType.VIDEO && learningItem.videoContents) {
            dto.videoContents = learningItem.videoContents.map(vc => {
                const mediaFiles = mediaFilesMap?.get(vc.videoContentId)
                return VideoContentResponseDto.fromEntity(vc, mediaFiles)
            })
        }

        return dto
    }
}
