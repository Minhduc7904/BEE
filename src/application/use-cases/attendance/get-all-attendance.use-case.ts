import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import type { ITuitionPaymentRepository } from 'src/domain/repositories/tuition-payment.repository'
import type { IHomeworkSubmitRepository } from 'src/domain/repositories/homework-submit.repository'
import {
  AttendanceListResponseDto,
  AttendanceResponseDto,
} from '../../dtos/attendance/attendance.dto'
import { AttendanceListQueryDto } from '../../dtos/attendance/attendance-list-query.dto'
import { TuitionFilterStatus } from '../../dtos/attendance/attendance-list-query.dto'

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

    // ====================================================================
    // Nếu có tuitionStatus → lấy hết attendance, lọc theo tuition, rồi phân trang thủ công
    // ====================================================================
    if (query.tuitionStatus && query.month && query.year) {
      return this.executeWithTuitionFilter(query, filters, pagination)
    }

    // ====================================================================
    // Logic gốc: phân trang bình thường từ DB
    // ====================================================================
    const result = await this.attendanceRepository.findAllWithPagination(
      pagination,
      filters,
    )

    // Nếu có month và year, tìm học phí cho từng attendance
    let tuitionPaymentsMap = new Map()
    
    if (query.month && query.year) {
      const studentIds = [...new Set(result.data.map(a => a.studentId))]
      
      if (studentIds.length > 0) {
        const tuitionPayments = await this.tuitionPaymentRepository.findByMonthYear(
          query.month,
          query.year,
          studentIds,
        )
        
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

  /**
   * Lấy tất cả attendance → resolve tuition → lọc theo tuitionStatus → phân trang thủ công
   */
  private async executeWithTuitionFilter(
    query: AttendanceListQueryDto,
    filters: any,
    pagination: any,
  ): Promise<AttendanceListResponseDto> {
    // 1. Lấy TOÀN BỘ attendance khới DB (không phân trang)
    const allAttendances = await this.attendanceRepository.findWithFilter(filters)

    // 2. Lấy danh sách studentId duy nhất
    const studentIds = [...new Set(allAttendances.map(a => a.studentId))]

    // 3. Query tuition payments cho tháng/năm đã chỉ định
    const tuitionPaymentsMap = new Map<number, any>()
    if (studentIds.length > 0) {
      const tuitionPayments = await this.tuitionPaymentRepository.findByMonthYear(
        query.month!,
        query.year!,
        studentIds,
      )
      tuitionPayments.forEach(tp => {
        tuitionPaymentsMap.set(tp.studentId, tp)
      })
    }

    // 4. Lọc theo tuitionStatus
    const filtered = allAttendances.filter(attendance => {
      const tp = tuitionPaymentsMap.get(attendance.studentId)

      switch (query.tuitionStatus) {
        case TuitionFilterStatus.PAID:
          return tp && tp.status === 'PAID'
        case TuitionFilterStatus.UNPAID:
          return tp && tp.status === 'UNPAID'
        case TuitionFilterStatus.NO_TUITION:
          return !tp
        default:
          return true
      }
    })

    // 5. Phân trang thủ công
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const total = filtered.length
    const start = (page - 1) * limit
    const paged = filtered.slice(start, start + limit)

    // 6. Homework submits (nếu cần)
    let homeworkSubmitsMap = new Map<number, any>()
    if (query.homeworkContentId) {
      const pagedStudentIds = [...new Set(paged.map(a => a.studentId))]
      if (pagedStudentIds.length > 0) {
        const homeworkSubmits = await this.homeworkSubmitRepository.findManyByContentAndStudents(
          query.homeworkContentId,
          pagedStudentIds,
        )
        homeworkSubmits.forEach(hs => {
          if (!homeworkSubmitsMap.has(hs.studentId)) {
            homeworkSubmitsMap.set(hs.studentId, hs)
          }
        })
      }
    }

    // 7. Map sang response DTOs
    const attendanceResponses = paged.map(attendance => {
      const tuitionPayment = tuitionPaymentsMap.get(attendance.studentId)
      const homeworkSubmit = homeworkSubmitsMap.get(attendance.studentId)
      return new AttendanceResponseDto(attendance, tuitionPayment, homeworkSubmit)
    })

    return new AttendanceListResponseDto(
      attendanceResponses,
      page,
      limit,
      total,
    )
  }
}
