// src/domain/interface/course/course.interface.ts
import { Course } from '../../entities'

export interface CreateCourseData {
  title: string
  subtitle?: string
  academicYear?: string
  grade?: number
  subjectId?: number
  description?: string
  priceVND: number
  compareAtVND?: number
  visibility?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  teacherId?: number
  isUpdatable?: boolean
}

export interface UpdateCourseData {
  title?: string
  subtitle?: string
  academicYear?: string
  grade?: number
  subjectId?: number
  description?: string
  priceVND?: number
  compareAtVND?: number
  visibility?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  teacherId?: number
  isUpdatable?: boolean
}

export interface CourseFilterOptions {
  grade?: number
  subjectId?: number
  visibility?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  teacherId?: number
  academicYear?: string
  search?: string
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
