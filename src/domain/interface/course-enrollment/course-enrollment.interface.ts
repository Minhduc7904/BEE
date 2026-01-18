import { CourseEnrollment } from '../../entities/course-enrollment/course-enrollment.entity';

export interface CreateCourseEnrollmentData {
  courseId: number;
  studentId: number;
  status?: string;
}

export interface UpdateCourseEnrollmentData {
  status?: string;
}

export interface CourseEnrollmentFilterOptions {
  courseId?: number;
  studentId?: number;
  status?: string;
  search?: string;
  enrolledAtFrom?: Date;
  enrolledAtTo?: Date;
  courseVisibility?: string;
}

export interface CourseEnrollmentPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CourseEnrollmentListResult {
  data: CourseEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
