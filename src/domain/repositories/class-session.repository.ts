// src/domain/repositories/class-session.repository.ts
import { ClassSession } from '../entities/class-session/class-session.entity'
import {
    CreateClassSessionData,
    UpdateClassSessionData,
    ClassSessionFilterOptions,
    ClassSessionPaginationOptions,
    ClassSessionListResult,
    ClassSessionNotificationMoment,
} from '../interface/class-session/class-session.interface'

export interface IClassSessionRepository {
    // Basic CRUD
    create(data: CreateClassSessionData): Promise<ClassSession>
    findById(id: number): Promise<ClassSession | null>
    findByIds(ids: number[]): Promise<ClassSession[]>
    update(id: number, data: UpdateClassSessionData): Promise<ClassSession>
    delete(id: number): Promise<boolean>
    findAll(): Promise<ClassSession[]>

    // Pagination methods (CHUẨN GIỐNG CourseRepo)
    findAllWithPagination(
        pagination: ClassSessionPaginationOptions,
        filters?: ClassSessionFilterOptions,
    ): Promise<ClassSessionListResult>

    findStudentClassSessionsWithPagination(
        studentId: number,
        pagination: ClassSessionPaginationOptions,
        filters?: ClassSessionFilterOptions,
    ): Promise<ClassSessionListResult>

    // Query methods (DOMAIN-LEVEL)
    findByClass(classId: number): Promise<ClassSession[]>
    // findByDateRange(startDate: Date, endDate: Date): Promise<ClassSession[]>
    findByDate(date: Date): Promise<ClassSession[]>
    /**
     * Buổi học của các lớp có `sessionDate` trong [fromDate, toDate] (cột DATE, so sánh theo ngày lịch).
     * Sắp theo ngày rồi giờ bắt đầu.
     */
    findByClassIdsAndSessionDateRange(classIds: number[], fromDate: Date, toDate: Date): Promise<ClassSession[]>
    /**
     * Buổi học của các lớp; nếu có `range` thì chỉ lấy buổi có `sessionDate` trong [from, to] (cột DATE).
     * Sắp theo ngày rồi giờ bắt đầu.
     */
    findByClassIds(classIds: number[], range?: { from: Date; to: Date }): Promise<ClassSession[]>

    /**
     * Buổi học của ngày `sessionDate` (cột DATE, nửa đêm UTC) còn ít nhất một mốc thông báo điểm danh chưa xử lý,
     * kèm `courseClass`.
     */
    findForAttendanceNotification(sessionDate: Date): Promise<ClassSession[]>
    /**
     * Đánh dấu mốc đã xử lý bằng cập nhật có điều kiện (cột dấu đang null). Trả `true` khi chính lần gọi này
     * giành được mốc, `false` nếu mốc đã được xử lý trước đó (chặn chạy trùng).
     */
    claimNotificationMoment(sessionId: number, moment: ClassSessionNotificationMoment, now: Date): Promise<boolean>

    // Count methods
    count(filters?: ClassSessionFilterOptions): Promise<number>
    countByClass(classId: number): Promise<number>
}
