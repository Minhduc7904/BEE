import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import { AttendanceStatisticsDto } from '../../dtos/attendance/attendance-statistics.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { AttendanceStatus } from 'src/shared/enums'

@Injectable()
export class GetAttendanceStatisticsBySessionUseCase {
    constructor(
        @Inject('IAttendanceRepository')
        private readonly attendanceRepository: IAttendanceRepository,
    ) { }

    async execute(sessionId: number): Promise<BaseResponseDto<AttendanceStatisticsDto>> {
        const attendances = await this.attendanceRepository.findAllWithPagination(
            { page: 1, limit: 999999 },
            { sessionId },
        )

        const total = attendances.total
        const present = attendances.data.filter(a => a.status === AttendanceStatus.PRESENT).length
        const absent = attendances.data.filter(a => a.status === AttendanceStatus.ABSENT).length
        const late = attendances.data.filter(a => a.status === AttendanceStatus.LATE).length
        const makeup = attendances.data.filter(a => a.status === AttendanceStatus.MAKEUP).length

        const statistics = new AttendanceStatisticsDto({
            total,
            present,
            absent,
            late,
            makeup,
        })

        return {
            success: true,
            message: 'Lấy thống kê điểm danh thành công',
            data: statistics,
        }
    }
}
