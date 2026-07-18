// src/application/dtos/learningItem/student-learning-item.dto.ts
import { LearningItem, StudentLearningItem, HomeworkSubmit, CompetitionSubmit } from '../../../domain/entities'
import { LearningItemType } from '../../../shared/enums'
import { HomeworkContentResponseDto } from '../homeworkContent/homework-content.dto'
import { DocumentContentResponseDto, MediaFileDto } from '../documentContent/document-content.dto'
import { YoutubeContentResponseDto } from '../youtubeContent/youtube-content.dto'
import { VideoContentResponseDto } from '../videoContent/video-content.dto'
import { StudentLearningItemStateResponseDto } from '../studentLearningItem'

/**
 * Trạng thái làm bài homework/competition
 */
export enum HomeworkStatus {
    DO_NOW = 'DO_NOW',              // Làm ngay (còn hạn, chưa làm hoặc có thể làm lại)
    RESUME = 'RESUME',              // Làm tiếp (đang có lần thi còn dở, chưa nộp)
    REDO = 'REDO',                  // Làm lại (còn hạn, đã làm nhưng chưa đạt max attempts)
    LATE_SUBMIT = 'LATE_SUBMIT',    // Chưa từng nộp, đã quá dueDate nhưng được nộp muộn
    LATE_REDO = 'LATE_REDO',        // Đã nộp/làm trước đó, còn lượt và được làm lại muộn
    OVERDUE = 'OVERDUE',            // Quá hạn (không thể làm nữa)
    COMPLETED = 'COMPLETED',        // Đã dùng hết số lượt làm được phép
    NOT_STARTED = 'NOT_STARTED',    // Chưa đến thời gian bắt đầu
}

/**
 * DTO cho Homework Submit info
 */
export class HomeworkSubmitDto {
    homeworkSubmitId: number
    isDone: boolean
    submitAt?: Date
    points?: number
    gradedAt?: Date
    feedback?: string
    competitionSubmitId?: number

    static fromEntity(homeworkSubmit: HomeworkSubmit | null): HomeworkSubmitDto | undefined {
        if (!homeworkSubmit) return undefined

        const dto = new HomeworkSubmitDto()
        dto.homeworkSubmitId = homeworkSubmit.homeworkSubmitId
        dto.isDone = true // Có submit thì đã done
        dto.submitAt = homeworkSubmit.submitAt
        dto.points = homeworkSubmit.points ?? undefined
        dto.gradedAt = homeworkSubmit.gradedAt ?? undefined
        dto.feedback = homeworkSubmit.feedback ?? undefined
        dto.competitionSubmitId = homeworkSubmit.competitionSubmitId ?? undefined
        return dto
    }
}

/**
 * DTO cho Competition Submit info
 */
export class CompetitionSubmitDto {
    competitionSubmitId: number
    attemptNumber: number
    status: string
    submittedAt?: Date
    totalPoints?: number
    maxPoints?: number

    static fromEntity(submit: CompetitionSubmit): CompetitionSubmitDto {
        const dto = new CompetitionSubmitDto()
        dto.competitionSubmitId = submit.competitionSubmitId
        dto.attemptNumber = submit.attemptNumber
        dto.status = submit.status
        dto.submittedAt = submit.submittedAt ?? undefined
        dto.totalPoints = submit.totalPoints ? Number(submit.totalPoints) : undefined
        dto.maxPoints = submit.maxPoints ? Number(submit.maxPoints) : undefined
        return dto
    }
}

/**
 * DTO cho Homework Progress (khi type là HOMEWORK)
 */
export class HomeworkProgressDto {
    // Từ StudentLearningItem
    isLearned: boolean
    learnedAt?: Date

    // Từ HomeworkSubmit
    homeworkSubmit?: HomeworkSubmitDto
    isDone: boolean

    // Submit gần nhất của competition; không trả toàn bộ lịch sử lượt làm ở API chi tiết learning item.
    competitionSubmit?: CompetitionSubmitDto
    attemptCount: number
    maxAttempts?: number

    // Thông tin về deadline và trạng thái
    questionCount?: number
    dueDate?: Date
    deadline?: Date  // Deadline cuối cùng (endDate của competition hoặc dueDate)
    remainingTimeSeconds?: number
    status: HomeworkStatus
    canAttempt: boolean

    static create(params: {
        studentLearningItem: StudentLearningItem | null
        homeworkSubmit: HomeworkSubmit | null
        latestCompetitionSubmit: CompetitionSubmit | null
        submittedAttemptCount: number
        questionCount?: number
        dueDate?: Date
        startDate?: Date
        endDate?: Date
        maxAttempts?: number
        allowLateSubmit: boolean
        /** Nếu false → ẩn điểm khỏi homeworkSubmit và competitionSubmit */
        allowViewScore?: boolean
    }): HomeworkProgressDto {
        const dto = new HomeworkProgressDto()
        const canViewScore = params.allowViewScore !== false // default true

        // StudentLearningItem progress
        dto.isLearned = params.studentLearningItem?.isLearned ?? false
        dto.learnedAt = params.studentLearningItem?.learnedAt ?? undefined

        // HomeworkSubmit
        dto.homeworkSubmit = HomeworkSubmitDto.fromEntity(params.homeworkSubmit)
        if (dto.homeworkSubmit && !canViewScore) {
            dto.homeworkSubmit.points = undefined
        }
        dto.isDone = params.homeworkSubmit !== null

        // Chỉ trả lượt competition gần nhất để tránh lặp toàn bộ lịch sử trong response.
        dto.competitionSubmit = params.latestCompetitionSubmit
            ? CompetitionSubmitDto.fromEntity(params.latestCompetitionSubmit)
            : undefined
        if (dto.competitionSubmit) {
            if (!canViewScore) {
                dto.competitionSubmit.totalPoints = undefined
                dto.competitionSubmit.maxPoints = undefined
            }
        }
        // Số lượt đã nộp được lấy bằng COUNT ở use case, không tải toàn bộ lịch sử submit.
        dto.attemptCount = params.submittedAttemptCount
        dto.maxAttempts = params.maxAttempts
        const hasInProgressSubmit = params.latestCompetitionSubmit?.status === 'IN_PROGRESS'

        // Question count
        dto.questionCount = params.questionCount

        // Deadline calculation
        dto.dueDate = params.dueDate
        const now = new Date()
        // Xác định deadline cuối cùng (ưu tiên endDate nếu có, không thì dùng dueDate)
        const finalDeadline = params.endDate ?? params.dueDate
        dto.deadline = finalDeadline

        // Tính thời gian còn lại
        if (finalDeadline) {
            const remaining = finalDeadline.getTime() - now.getTime()
            dto.remainingTimeSeconds = remaining > 0 ? Math.floor(remaining / 1000) : 0
        }

        // Xác định trạng thái
        dto.status = HomeworkProgressDto.determineStatus({
            now,
            dueDate: params.dueDate,
            startDate: params.startDate,
            endDate: params.endDate,
            attemptCount: dto.attemptCount,
            maxAttempts: params.maxAttempts,
            allowLateSubmit: params.allowLateSubmit,
            isDone: dto.isDone,
            hasInProgressSubmit,
        })
        const isAttemptStatusAllowed = [
            HomeworkStatus.DO_NOW,
            HomeworkStatus.RESUME,
            HomeworkStatus.REDO,
            HomeworkStatus.LATE_SUBMIT,
            HomeworkStatus.LATE_REDO,
        ].includes(dto.status)
        const hasAttemptsRemaining =
            dto.maxAttempts === undefined
            || dto.maxAttempts === null
            || dto.attemptCount < dto.maxAttempts

        dto.canAttempt = isAttemptStatusAllowed && hasAttemptsRemaining

        return dto
    }

    private static determineStatus(params: {
        now: Date
        dueDate?: Date
        startDate?: Date
        endDate?: Date
        attemptCount: number
        maxAttempts?: number
        allowLateSubmit: boolean
        isDone: boolean
        hasInProgressSubmit: boolean
    }): HomeworkStatus {
        const {
            now,
            dueDate,
            startDate,
            endDate,
            attemptCount,
            maxAttempts,
            allowLateSubmit,
            isDone,
            hasInProgressSubmit,
        } = params

        // Nếu đang có lần thi IN_PROGRESS → ưu tiên cho làm tiếp trước mọi kiểm tra khác
        if (hasInProgressSubmit) {
            return HomeworkStatus.RESUME
        }

        // Nếu đã đạt max attempts
        if (maxAttempts && attemptCount >= maxAttempts) {
            return HomeworkStatus.COMPLETED
        }

        /**
         * Nếu competition có endDate và đã quá endDate
         * => hết hạn thật sự, không được nộp nữa.
         */
        if (endDate && now > endDate) {
            return HomeworkStatus.OVERDUE
        }

        /**
         * Nếu homework có dueDate và đã quá dueDate:
         * - allowLateSubmit = true:
         *   + Nếu có endDate thì do phía trên đã check chưa quá endDate => cho nộp muộn.
         *   + Nếu không có endDate => cho nộp muộn vô thời hạn.
         *   + Đã có bài nộp/lượt thi trước đó => LATE_REDO; ngược lại => LATE_SUBMIT.
         * - allowLateSubmit = false => quá hạn.
         */
        if (dueDate && now > dueDate) {
            if (allowLateSubmit) {
                return isDone || attemptCount > 0
                    ? HomeworkStatus.LATE_REDO
                    : HomeworkStatus.LATE_SUBMIT
            }

            return HomeworkStatus.OVERDUE
        }

        // Chưa đến thời gian bắt đầu
        if (startDate && now < startDate) {
            return HomeworkStatus.NOT_STARTED
        }

        // Còn trong thời hạn
        if (attemptCount > 0) {
            return HomeworkStatus.REDO
        }

        return HomeworkStatus.DO_NOW
    }
}

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

    // Progress của student (cho DOCUMENT, YOUTUBE, VIDEO)
    // Với HOMEWORK: progress được gắn vào từng homeworkContent
    progress?: StudentLearningItemProgressDto
    studentLearningItem: StudentLearningItemStateResponseDto | null

    // Content tùy theo type (chỉ 1 trong 4 sẽ có giá trị)
    homeworkContents?: HomeworkContentResponseDto[]
    documentContents?: DocumentContentResponseDto[]
    youtubeContents?: YoutubeContentResponseDto[]
    videoContents?: VideoContentResponseDto[]

    static fromEntity(
        learningItem: LearningItem,
        studentLearningItem: StudentLearningItem | null,
        mediaFilesMap?: Map<number, MediaFileDto[]>,
        homeworkProgressMap?: Map<number, HomeworkProgressDto>,
    ): StudentLearningItemResponseDto {
        const dto = new StudentLearningItemResponseDto()

        // Basic info
        dto.learningItemId = learningItem.learningItemId
        dto.type = learningItem.type
        dto.title = learningItem.title
        dto.description = learningItem.description ?? undefined
        dto.createdAt = learningItem.createdAt
        dto.updatedAt = learningItem.updatedAt

        // Progress (cho non-homework types)
        if (learningItem.type !== LearningItemType.HOMEWORK) {
            dto.progress = StudentLearningItemProgressDto.fromEntity(studentLearningItem)
        }
        dto.studentLearningItem = StudentLearningItemStateResponseDto.fromPrisma(studentLearningItem)

        // Content theo type
        if (learningItem.type === LearningItemType.HOMEWORK && learningItem.homeworkContents) {
            // Với HOMEWORK: gắn progress vào từng homeworkContent
            dto.homeworkContents = learningItem.homeworkContents.map(hc => {
                const progress = homeworkProgressMap?.get(hc.homeworkContentId)
                return HomeworkContentResponseDto.fromEntity(hc, progress)
            })
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
