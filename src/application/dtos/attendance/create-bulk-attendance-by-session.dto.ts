// src/application/dtos/attendance/create-bulk-attendance-by-session.dto.ts
import { IsInt, IsEnum, IsOptional, Min } from 'class-validator'
import { AttendanceStatus } from '@prisma/client'

/**
 * DTO để tạo hàng loạt attendance cho tất cả học sinh trong 1 buổi học
 */
export class CreateBulkAttendanceBySessionDto {
    @IsInt()
    @Min(1)
    sessionId: number

    @IsEnum(AttendanceStatus)
    @IsOptional()
    status?: AttendanceStatus // mặc định sẽ là PRESENT nếu không truyền

    @IsOptional()
    notes?: string
}
