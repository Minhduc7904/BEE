// src/domain/repositories/student.repository.ts
import { Student } from '../entities/user/student.entity'
import {
  CreateStudentData,
  StudentFilterOptions,
  StudentPaginationOptions,
  StudentListResult,
} from '../interface/student/student.interface'

export interface IStudentRepository {
  create(data: CreateStudentData): Promise<Student>
  findById(id: number | string): Promise<Student | null>
  findByUserId(userId: number): Promise<Student | null>
  update(id: number, data: Partial<Student>): Promise<Student>
  delete(id: number): Promise<boolean>

  // Legacy methods (kept for backward compatibility)
  findByGrade(grade: number): Promise<Student[]>
  findAll(): Promise<Student[]>

  // New pagination methods
  findAllWithPagination(
    pagination: StudentPaginationOptions,
    filters?: StudentFilterOptions,
  ): Promise<StudentListResult>

  // Search methods
  searchStudents(searchTerm: string, pagination?: StudentPaginationOptions): Promise<StudentListResult>

  // Filter methods
  findByFilters(filters: StudentFilterOptions, pagination?: StudentPaginationOptions): Promise<StudentListResult>

  // Count methods
  count(filters?: StudentFilterOptions): Promise<number>
  countByGrade(grade: number): Promise<number>
  countBySchool(school: string): Promise<number>
}
