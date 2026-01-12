import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import {
  AttendanceListResponseDto,
  AttendanceResponseDto,
} from '../../dtos/attendance/attendance.dto'
import { AttendanceListQueryDto } from '../../dtos/attendance/attendance-list-query.dto'

@Injectable()
export class GetAllAttendanceUseCase {
  constructor(
    @Inject('IAttendanceRepository')
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  async execute(query: AttendanceListQueryDto): Promise<AttendanceListResponseDto> {
    const filters = query.toAttendanceFilterOptions()
    const pagination = query.toAttendancePaginationOptions()

    const result = await this.attendanceRepository.findAllWithPagination(
      pagination,
      filters,
    )

    const attendanceResponses = result.data.map(
      (attendance) => new AttendanceResponseDto(attendance),
    )

    return new AttendanceListResponseDto(
      attendanceResponses,
      result.page,
      result.limit,
      result.total,
    )
  }
}
