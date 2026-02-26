// src/shared/enums/competition-submit-status.enum.ts

export enum CompetitionSubmitStatus {
    IN_PROGRESS = 'IN_PROGRESS', // Đang làm bài
    SUBMITTED = 'SUBMITTED', // Đã nộp bài, chờ chấm
    GRADED = 'GRADED', // Đã chấm xong
    ABANDONED = 'ABANDONED', // Bỏ dở (hết giờ mà chưa nộp)
}
