import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import type { ITuitionPaymentRepository } from 'src/domain/repositories/tuition-payment.repository'
import type { IHomeworkSubmitRepository } from 'src/domain/repositories/homework-submit.repository'
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
    @Inject('IHomeworkSubmitRepository')
    private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
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

    // Nếu có homeworkContentId, tìm homework submit cho từng attendance
    let homeworkSubmitsMap = new Map<number, any>()

    if (query.homeworkContentId) {
      const studentIds = [...new Set(result.data.map(a => a.studentId))]

      if (studentIds.length > 0) {
        const homeworkSubmits = await this.homeworkSubmitRepository.findManyByContentAndStudents(
          query.homeworkContentId,
          studentIds,
        )

        // Map studentId -> homeworkSubmit (lấy bài nộp mới nhất nếu có nhiều)
        homeworkSubmits.forEach(hs => {
          if (!homeworkSubmitsMap.has(hs.studentId)) {
            homeworkSubmitsMap.set(hs.studentId, hs)
          }
        })
      }
    }

    const attendanceResponses = result.data.map((attendance) => {
      const tuitionPayment = tuitionPaymentsMap.get(attendance.studentId)
      const homeworkSubmit = homeworkSubmitsMap.get(attendance.studentId)
      return new AttendanceResponseDto(attendance, tuitionPayment, homeworkSubmit)
    })

    return new AttendanceListResponseDto(
      attendanceResponses,
      result.page,
      result.limit,
      result.total,
    )
  }
}
