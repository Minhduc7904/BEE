import { CourseEnrollment } from '../../entities/course-enrollment/course-enrollment.entity';
import { CourseEnrollmentStatus } from 'src/shared/enums';
export interface CreateCourseEnrollmentData {
  courseId: number;
  studentId: number;
  status?: CourseEnrollmentStatus;
}

export interface UpdateCourseEnrollmentData {
  status?: CourseEnrollmentStatus;
}

export interface CourseEnrollmentFilterOptions {
  courseId?: number;
  studentId?: number;
  status?: CourseEnrollmentStatus;
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
