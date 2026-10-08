import { AttendanceStatus, AttendanceType } from 'src/shared/enums'

export interface CreateAttendanceData {
    sessionId: number
    studentId: number
    status: AttendanceStatus
    attendanceType?: AttendanceType
    notes?: string
    markerId?: number
    parentNotified?: boolean
}

export interface UpdateAttendanceData {
    status?: AttendanceStatus
    attendanceType?: AttendanceType
    notes?: string
    markerId?: number
    parentNotified?: boolean
    markedAt?: Date
}

export interface AttendanceFilterOptions {
    sessionId?: number
    studentId?: number
    classId?: number
    status?: AttendanceStatus
    attendanceType?: AttendanceType
    search?: string
    fromDate?: string
    toDate?: string
    studentIds?: number[]
    month?: number
    year?: number
}

export interface AttendancePaginationOptions {
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface AttendanceListResult {
    data: any[]
    total: number
    page: number
    limit: number
    totalPages: number
}
