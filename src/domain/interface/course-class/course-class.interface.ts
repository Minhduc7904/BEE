export interface CreateCourseClassData {
  courseId: number;
  className: string;
  startDate?: Date;
  endDate?: Date;
  weeklySchedule?: string;
  room?: string;
  instructorId?: number;
}

export interface UpdateCourseClassData {
  className?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  weeklySchedule?: string | null;
  room?: string | null;
  instructorId?: number | null;
}

export interface CourseClassFilterOptions {
  courseId?: number;
  courseIds?: number[];
  instructorId?: number;
  teacherId?: number;
  isCourseEnded?: boolean;
  isActive?: boolean;
  isUpcoming?: boolean;
  isCompleted?: boolean;
  search?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  /** Lọc theo khối lớp của khóa học */
  grade?: number;
}

export interface CourseClassPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CourseClassListResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
