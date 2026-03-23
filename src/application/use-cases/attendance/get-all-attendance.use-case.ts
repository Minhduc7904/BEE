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
import type { Attendance } from 'src/domain/entities/attendance/attendance.entity'

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

  private getHomeworkSubmitKey(studentId: number, homeworkId: number): string {
    return `${studentId}:${homeworkId}`
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = day === 0 ? -6 : 1 - day
    weekStart.setDate(weekStart.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  private getWeekEnd(date: Date): Date {
    const weekEnd = new Date(this.getWeekStart(date))
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(12, 59, 59, 999)
    return weekEnd
  }

  private getWeekKey(date: Date): string {
    const weekStart = this.getWeekStart(date)
    const year = weekStart.getFullYear()
    const month = `${weekStart.getMonth() + 1}`.padStart(2, '0')
    const day = `${weekStart.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Lấy các attendance khác trong cùng tuần cho từng attendance theo studentId.
   */
  private async resolveOtherAttendancesInWeek(
    attendances: Attendance[],
  ): Promise<Map<number, Attendance[]>> {
    const result = new Map<number, Attendance[]>()

    if (attendances.length === 0) {
      return result
    }

    const studentIds = [...new Set(attendances.map((attendance) => attendance.studentId))]

    let minWeekStart: Date | null = null
    let maxWeekEnd: Date | null = null

    for (const attendance of attendances) {
      const weekStart = this.getWeekStart(attendance.markedAt)
      const weekEnd = this.getWeekEnd(attendance.markedAt)

      if (!minWeekStart || weekStart < minWeekStart) {
        minWeekStart = weekStart
      }

      if (!maxWeekEnd || weekEnd > maxWeekEnd) {
        maxWeekEnd = weekEnd
      }
    }

    if (!minWeekStart || !maxWeekEnd || studentIds.length === 0) {
      return result
    }

    const weeklyAttendances = await this.attendanceRepository.findByStudentsAndMarkedAtRange(
      studentIds,
      minWeekStart,
      maxWeekEnd,
    )

    const attendancesByStudentAndWeek = new Map<string, Attendance[]>()
    for (const attendance of weeklyAttendances) {
      const key = `${attendance.studentId}:${this.getWeekKey(attendance.markedAt)}`
      const items = attendancesByStudentAndWeek.get(key) || []
      items.push(attendance)
      attendancesByStudentAndWeek.set(key, items)
    }

    for (const attendance of attendances) {
      const key = `${attendance.studentId}:${this.getWeekKey(attendance.markedAt)}`
      const weeklyItems = attendancesByStudentAndWeek.get(key) || []
      result.set(
        attendance.attendanceId,
        weeklyItems.filter((item) => item.attendanceId !== attendance.attendanceId),
      )
    }

    return result
  }

  /**
   * Resolve bài nộp theo homeworkId gắn trong từng session của attendance.
   */
  private async resolveHomeworkSubmitsBySession(
    attendances: Attendance[],
  ): Promise<Map<string, any>> {
    const studentIdsByHomeworkId = new Map<number, Set<number>>()

    for (const attendance of attendances) {
      const homeworkId = attendance.classSession?.homeworkId
      if (typeof homeworkId !== 'number') {
        continue
      }

      if (!studentIdsByHomeworkId.has(homeworkId)) {
        studentIdsByHomeworkId.set(homeworkId, new Set<number>())
      }

      studentIdsByHomeworkId.get(homeworkId)!.add(attendance.studentId)
    }

    const homeworkSubmitsMap = new Map<string, any>()

    for (const [homeworkId, studentIdSet] of studentIdsByHomeworkId.entries()) {
      const studentIds = [...studentIdSet]
      if (studentIds.length === 0) {
        continue
      }

      const homeworkSubmits = await this.homeworkSubmitRepository.findManyByContentAndStudents(
        homeworkId,
        studentIds,
      )

      for (const submit of homeworkSubmits) {
        const key = this.getHomeworkSubmitKey(submit.studentId, homeworkId)
        if (!homeworkSubmitsMap.has(key)) {
          homeworkSubmitsMap.set(key, submit)
        }
      }
    }

    return homeworkSubmitsMap
  }

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

    // Tự động resolve homework submit theo homeworkId của session
    const homeworkSubmitsMap = await this.resolveHomeworkSubmitsBySession(result.data)
    const otherAttendancesInWeekMap = await this.resolveOtherAttendancesInWeek(result.data)

    const attendanceResponses = result.data.map((attendance) => {
      const tuitionPayment = tuitionPaymentsMap.get(attendance.studentId)
      const homeworkId = attendance.classSession?.homeworkId
      const homeworkSubmit =
        typeof homeworkId === 'number'
          ? homeworkSubmitsMap.get(this.getHomeworkSubmitKey(attendance.studentId, homeworkId))
          : undefined
      const otherAttendancesInWeek = otherAttendancesInWeekMap.get(attendance.attendanceId)
      return new AttendanceResponseDto(
        attendance,
        tuitionPayment,
        homeworkSubmit,
        otherAttendancesInWeek,
      )
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

    // 6. Homework submits theo homeworkId của session (nếu có)
    const homeworkSubmitsMap = await this.resolveHomeworkSubmitsBySession(paged)
    const otherAttendancesInWeekMap = await this.resolveOtherAttendancesInWeek(paged)

    // 7. Map sang response DTOs
    const attendanceResponses = paged.map(attendance => {
      const tuitionPayment = tuitionPaymentsMap.get(attendance.studentId)
      const homeworkId = attendance.classSession?.homeworkId
      const homeworkSubmit =
        typeof homeworkId === 'number'
          ? homeworkSubmitsMap.get(this.getHomeworkSubmitKey(attendance.studentId, homeworkId))
          : undefined
      const otherAttendancesInWeek = otherAttendancesInWeekMap.get(attendance.attendanceId)
      return new AttendanceResponseDto(
        attendance,
        tuitionPayment,
        homeworkSubmit,
        otherAttendancesInWeek,
      )
    })

    return new AttendanceListResponseDto(
      attendanceResponses,
      page,
      limit,
      total,
    )
  }
}
