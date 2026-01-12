import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteAttendanceUseCase {
  constructor(
    @Inject('IAttendanceRepository')
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  async execute(attendanceId: number): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const existing = await this.attendanceRepository.findById(attendanceId)

    if (!existing) {
      throw new NotFoundException(`Điểm danh với ID ${attendanceId} không tồn tại`)
    }

    const deleted = await this.attendanceRepository.delete(attendanceId)

    return BaseResponseDto.success('Xóa điểm danh thành công', { deleted })
  }
}
