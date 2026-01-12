import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import { AttendanceResponseDto } from 'src/application/dtos/attendance/attendance.dto'
import { UpdateAttendanceDto } from 'src/application/dtos/attendance/update-attendance.dto'
import { UpdateAttendanceData } from 'src/domain/interface/attendance/attendance.interface'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateAttendanceUseCase {
  constructor(
    @Inject('IAttendanceRepository')
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  async execute(
    attendanceId: number,
    dto: UpdateAttendanceDto,
    markerId?: number,
  ): Promise<BaseResponseDto<AttendanceResponseDto>> {
    const existing = await this.attendanceRepository.findById(attendanceId)

    if (!existing) {
      throw new NotFoundException(`Điểm danh với ID ${attendanceId} không tồn tại`)
    }

    const data: UpdateAttendanceData = {
      status: dto.status,
      notes: dto.notes,
      markerId,
    }

    const attendance = await this.attendanceRepository.update(attendanceId, data)

    return BaseResponseDto.success(
      'Cập nhật điểm danh thành công',
      new AttendanceResponseDto(attendance),
    )
  }
}
