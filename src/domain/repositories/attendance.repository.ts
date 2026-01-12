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

  // Query methods (DOMAIN-LEVEL)
  findBySession(sessionId: number): Promise<Attendance[]>
  findByStudent(studentId: number): Promise<Attendance[]>
  findBySessionAndStudent(sessionId: number, studentId: number): Promise<Attendance | null>

  // Bulk operations
  createBulk(data: CreateAttendanceData[]): Promise<Attendance[]>
  updateBulk(updates: Array<{ id: number; data: UpdateAttendanceData }>): Promise<Attendance[]>

  // Count methods
  count(filters?: AttendanceFilterOptions): Promise<number>
  countBySession(sessionId: number): Promise<number>
  countByStudent(studentId: number): Promise<number>
}
