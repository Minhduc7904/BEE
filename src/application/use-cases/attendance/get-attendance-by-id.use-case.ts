import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import { AttendanceResponseDto } from 'src/application/dtos/attendance/attendance.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'

@Injectable()
export class GetAttendanceByIdUseCase {
  constructor(
    @Inject('IAttendanceRepository')
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  async execute(attendanceId: number): Promise<BaseResponseDto<AttendanceResponseDto>> {
    const attendance = await this.attendanceRepository.findById(attendanceId)

    if (!attendance) {
      throw new NotFoundException(`Điểm danh với ID ${attendanceId} không tồn tại`)
    }

    return BaseResponseDto.success(
      'Lấy điểm danh thành công',
      new AttendanceResponseDto(attendance),
    )
  }
}
