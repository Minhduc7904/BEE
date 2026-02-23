// src/application/dtos/competition/update-competition.dto.ts
import {
    IsOptionalString,
    IsOptionalDate,
    IsOptionalEnumValue,
    IsOptionalInt,
    IsOptionalBoolean,
    IsOptionalIdNumber,
} from '../../../shared/decorators/validate'
import { Visibility } from '../../../shared/enums'

export class UpdateCompetitionDto {
    /**
     * ID đề thi (chỉ cho phép cập nhật nếu chưa có examId)
     * @example 5
     */
    @IsOptionalIdNumber('ID đề thi')
    examId?: number

    /**
     * Tên cuộc thi
     * @example "Cuộc thi Toán học Olympiad 2024"
     */
    @IsOptionalString('Tên cuộc thi', 255, 1)
    title?: string

    /**
     * Phụ đề cuộc thi
     * @example "Dành cho học sinh lớp 10-12"
     */
    @IsOptionalString('Phụ đề', 255)
    subtitle?: string

    /**
     * Chính sách cuộc thi
     * @example "Học sinh cần tuân thủ quy định về thời gian và không gian làm bài"
     */
    @IsOptionalString('Chính sách', 5000)
    policies?: string

    /**
     * Ngày bắt đầu
     * @example "2024-06-01T00:00:00Z"
     */
    @IsOptionalDate('Ngày bắt đầu')
    startDate?: Date

    /**
     * Ngày kết thúc
     * @example "2024-06-30T23:59:59Z"
     */
    @IsOptionalDate('Ngày kết thúc')
    endDate?: Date

    /**
     * Thời lượng làm bài (phút)
     * @example 90
     */
    @IsOptionalInt('Thời lượng làm bài', 1, 999999)
    durationMinutes?: number

    /**
     * Số lần được làm (null = không giới hạn)
     * @example 3
     */
    @IsOptionalInt('Số lần được làm', 1, 999)
    maxAttempts?: number

    /**
     * Trạng thái hiển thị
     * @example "PUBLISHED"
     */
    @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
    visibility?: Visibility

    /**
     * Có hiển thị chi tiết kết quả không
     * @example true
     */
    @IsOptionalBoolean('Hiển thị chi tiết kết quả')
    showResultDetail?: boolean

    /**
     * Có hiển thị bảng xếp hạng không
     * @example true
     */
    @IsOptionalBoolean('Hiển thị bảng xếp hạng')
    allowLeaderboard?: boolean

    /**
     * Có cho phép xem điểm không
     * @example true
     */
    @IsOptionalBoolean('Cho phép xem điểm')
    allowViewScore?: boolean

    /**
     * Có cho phép xem đáp án không
     * @example false
     */
    @IsOptionalBoolean('Cho phép xem đáp án')
    allowViewAnswer?: boolean

    /**
     * Có bật chống gian lận không
     * @example true
     */
    @IsOptionalBoolean('Bật chống gian lận')
    enableAntiCheating?: boolean

    /**
     * Có cho phép xem video giải chi tiết trên YouTube không
     * @example false
     */
    @IsOptionalBoolean('Cho phép xem video giải YouTube')
    allowViewSolutionYoutubeUrl?: boolean

    /**
     * Có cho phép xem nội dung đề thi trước khi thi không
     * @example false
     */
    @IsOptionalBoolean('Cho phép xem nội dung đề thi')
    allowViewExamContent?: boolean
}
