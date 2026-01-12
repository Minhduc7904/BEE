import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import { AttendanceResponseDto } from 'src/application/dtos/attendance/attendance.dto'
import { CreateAttendanceDto } from 'src/application/dtos/attendance/create-attendance.dto'
import { CreateAttendanceData } from 'src/domain/interface/attendance/attendance.interface'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class CreateAttendanceUseCase {
    constructor(
        @Inject('IAttendanceRepository')
        private readonly attendanceRepository: IAttendanceRepository,
    ) { }

    async execute(
        dto: CreateAttendanceDto,
        markerId?: number,
    ): Promise<BaseResponseDto<AttendanceResponseDto>> {
        // Check if attendance already exists
        const existing = await this.attendanceRepository.findBySessionAndStudent(
            dto.sessionId,
            dto.studentId,
        )

        if (existing) {
            throw new ConflictException(
                'Điểm danh cho học sinh này trong buổi học đã tồn tại',
            )
        }

        const data: CreateAttendanceData = {
            sessionId: dto.sessionId,
            studentId: dto.studentId,
            status: dto.status,
            notes: dto.notes,
            markerId,
        }

        const attendance = await this.attendanceRepository.create(data)

        return BaseResponseDto.success(
            'Tạo điểm danh thành công',
            new AttendanceResponseDto(attendance),
        )
    }
}
