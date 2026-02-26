import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import type { ITuitionPaymentRepository } from 'src/domain/repositories/tuition-payment.repository'
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
    @Inject('ITuitionPaymentRepository')
    private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
  ) {}

  async execute(query: AttendanceListQueryDto): Promise<AttendanceListResponseDto> {
    const filters = query.toAttendanceFilterOptions()
    const pagination = query.toAttendancePaginationOptions()

    const result = await this.attendanceRepository.findAllWithPagination(
      pagination,
      filters,
    )

    // Nếu có month và year, tìm học phí cho từng attendance
    let tuitionPaymentsMap = new Map()
    
    if (query.month && query.year) {
      // Lấy danh sách studentId duy nhất
      const studentIds = [...new Set(result.data.map(a => a.studentId))]
      
      if (studentIds.length > 0) {
        // Query tất cả tuition payments cho tháng/năm này
        const tuitionPayments = await this.tuitionPaymentRepository.findByMonthYear(
          query.month,
          query.year,
          studentIds,
        )
        
        // Tạo map để tra cứu nhanh: studentId -> tuitionPayment
        tuitionPayments.forEach(tp => {
          tuitionPaymentsMap.set(tp.studentId, tp)
        })
      }
    }

    const attendanceResponses = result.data.map((attendance) => {
      const tuitionPayment = tuitionPaymentsMap.get(attendance.studentId)
      return new AttendanceResponseDto(attendance, tuitionPayment)
    })

    return new AttendanceListResponseDto(
      attendanceResponses,
      result.page,
      result.limit,
      result.total,
    )
  }
}
