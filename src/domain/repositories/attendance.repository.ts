// src/domain/repositories/attendance.repository.ts
import { Attendance } from '../entities/attendance/attendance.entity'
import {
  CreateAttendanceData,
  UpdateAttendanceData,
  AttendanceFilterOptions,
  AttendancePaginationOptions,
  AttendanceListResult,
} from '../interface/attendance/attendance.interface'

export interface IAttendanceRepository {
  // Basic CRUD
  create(data: CreateAttendanceData): Promise<Attendance>
  findById(id: number): Promise<Attendance | null>
  update(id: number, data: UpdateAttendanceData): Promise<Attendance>
  delete(id: number): Promise<boolean>
  findAll(): Promise<Attendance[]>

  // Pagination methods
  findAllWithPagination(
    pagination: AttendancePaginationOptions,
    filters?: AttendanceFilterOptions,
  ): Promise<AttendanceListResult>

  findWithFilter(
    filters: AttendanceFilterOptions,
  ): Promise<Attendance[]>

  // Query methods (DOMAIN-LEVEL)
  findBySession(sessionId: number): Promise<Attendance[]>
  findByStudent(studentId: number): Promise<Attendance[]>
  findBySessionAndStudent(sessionId: number, studentId: number): Promise<Attendance | null>
  findByStudentsAndMarkedAtRange(
    studentIds: number[],
    fromDate: Date,
    toDate: Date,
  ): Promise<Attendance[]>
  
  /**
   * Bản ghi điểm danh của một học sinh ở các buổi học (kèm `classSession` để sắp xếp theo ngày/giờ).
   */
  findByStudentAndSessionIds(studentId: number, sessionIds: number[]): Promise<Attendance[]>

  /**
   * Các bản ghi Vắng đang được bản ghi `attendanceId` học bù cho.
   */
  findByMakeupByAttendanceId(attendanceId: number): Promise<Attendance[]>

  /**
   * Gán (hoặc gỡ khi `value = null`) `makeupByAttendanceId` cho các bản ghi.
   */
  setMakeupByAttendanceId(ids: number[], value: number | null): Promise<void>

  // Bulk operations
  createBulk(data: CreateAttendanceData[]): Promise<Attendance[]>
  updateBulk(updates: Array<{ id: number; data: UpdateAttendanceData }>): Promise<Attendance[]>

  // Count methods
  count(filters?: AttendanceFilterOptions): Promise<number>
  countBySession(sessionId: number): Promise<number>
  countByStudent(studentId: number): Promise<number>
}
