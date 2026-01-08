import { ClassStudent } from '../../entities/class-student/class-student.entity';

export interface CreateClassStudentData {
  classId: number;
  studentId: number;
}

export interface ClassStudentFilterOptions {
  classId?: number;
  studentId?: number;
  search?: string;
}

export interface ClassStudentPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClassStudentListResult {
  data: ClassStudent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
