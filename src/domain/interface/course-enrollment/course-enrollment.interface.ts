import { CourseEnrollment } from '../../entities/course-enrollment/course-enrollment.entity';
import { CourseEnrollmentStatus } from 'src/shared/enums';
export interface CreateCourseEnrollmentData {
  courseId: number;
  studentId: number;
  status?: CourseEnrollmentStatus;
  isPaidFull?: boolean;
}

export interface UpdateCourseEnrollmentData {
  status?: CourseEnrollmentStatus;
  isPaidFull?: boolean;
}

export interface CourseEnrollmentFilterOptions {
  courseId?: number;
  studentId?: number;
  status?: CourseEnrollmentStatus;
  search?: string;
  enrolledAtFrom?: Date;
  enrolledAtTo?: Date;
  courseVisibility?: string;
  excludeVisibilities?: string[];
  grade?: number;
  subjectId?: number;
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
