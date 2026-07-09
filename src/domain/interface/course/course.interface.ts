// src/domain/interface/course/course.interface.ts
import { Course } from '../../entities'
import { CourseVisibility, AttendanceStatus, CourseType } from 'src/shared/enums'

export interface CreateCourseData {
  title: string
  subtitle?: string
  academicYear?: string
  grade?: number
  subjectId?: number
  description?: string
  priceVND: number
  compareAtVND?: number
  visibility?: CourseVisibility
  isEnded?: boolean
  courseType?: CourseType
  teacherId?: number
  isUpdatable?: boolean
}

export interface UpdateCourseData {
  // ===== Basic info =====
  title?: string
  subtitle?: string
  academicYear?: string
  grade?: number
  subjectId?: number
  description?: string
  visibility?: CourseVisibility
  isEnded?: boolean
  courseType?: CourseType
  teacherId?: number

  // ===== Pricing / payment =====
  priceVND?: number
  compareAtVND?: number
}

export interface CourseFilterOptions {
  grade?: number
  subjectId?: number
  visibility?: CourseVisibility
  excludeVisibility?: CourseVisibility
  isEnded?: boolean
  courseType?: CourseType
  courseTypes?: CourseType[]
  teacherId?: number
  academicYear?: string
  search?: string
  excludeActiveEnrollmentStudentId?: number
}

export interface CoursePaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CourseSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface CourseListResult {
  courses: Course[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StudentAttendanceFilterOptions {
  fromDate: Date
  toDate: Date
  search?: string
  status?: AttendanceStatus
}

export interface StudentAttendancePaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StudentAttendanceResult {
  students: any[] // Will contain student with their attendance records
  total: number
  page: number
  limit: number
  totalPages: number
}
